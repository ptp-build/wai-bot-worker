import * as http from 'http';
import mime from 'mime-types';
import path from 'path';
import fs from 'fs';
import { finished } from 'stream';
import { Readable } from 'stream';
import {WebSocketServer} from 'ws';
import {BaseServer} from './BaseServer';
import {WaiRouter} from '../../worker/route';
import {WsConnection} from './BaseConnection';
import MsgConnectionManager from '../../worker/services/MsgConnectionManager';
import {v4 as uuidv4} from 'uuid';
import { getCorsHeader, getCorsOptionsHeader } from '../../sdk/common/http';

export class WaiServer extends BaseServer {
  private httpServer?: http.Server;
  private wsServer?: WebSocketServer;
  private router?: WaiRouter;
  private enableWebSite: boolean;

  constructor(port: number) {
    super(port);
    this.enableWebSite = true
  }
  setEnableWebSite(enableWebSite:boolean){
    this.enableWebSite = enableWebSite
    return this
  }
  setRoute(router: WaiRouter) {
    this.router = router;
    return this;
  }

  async handleHttpRequest(request:Request){
    const { url } = request;
    if(url){
      const uri = new URL(url)
      if(this.enableWebSite && !uri.pathname.startsWith("/api") && uri.pathname !== "/docs"){
        let pathFile = path.join(__dirname)
        if(uri.pathname === "/"){
          pathFile  = path.join(pathFile,"index.html")
        }else{
          pathFile  = path.join(__dirname,uri.pathname)
        }

        const ext = path.extname(pathFile).toLowerCase();
        const fileStream = fs.createReadStream(pathFile);

        let contentType;
        if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
          contentType = `image/${ext.substring(1)}`;
        } else if (['.svg'].includes(ext)) {
          contentType = `image/svg+xml`;
        }else if (['.woff', '.woff2'].includes(ext)) {
          contentType = `font/${ext.substring(1)}`;
        } else if (ext === '.mp3') {
          contentType = 'audio/mpeg';
        } else {
          contentType = mime.lookup(ext) || 'application/octet-stream';
        }

        const readableStream = Readable.from(fileStream);
        const finishedPromise = new Promise((resolve, reject) => {
          finished(readableStream, (error) => {
            if (error) {
              reject(error);
            } else {
              resolve("");
            }
          });
        });

        const buffers = [];
        for await (const chunk of readableStream) {
          buffers.push(chunk);
        }
        const fileBuffer = Buffer.concat(buffers);
        await finishedPromise;
        const headers = {
          connection:"keep-alive",
          "accept-ranges": "bytes",
          "content-length": fileBuffer.length,
          "content-type": contentType,
          'cache-control': 'public, max-age=864000',
        }
        //@ts-ignore
        return new Response(fileBuffer,{status:200, headers})
      }
    }
    return await this.router!.handleRequest(request);
  }
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer = http.createServer(async (req, res:any) => {
        const { url, method } = req;
        let body = '';
        console.log(`${method} ${url}`)
        const reqUrl = `http://${req.headers.host}${url}`
        if (method === 'POST' || method === 'PUT') {
          req.on('data', (data:string) => {
            // chunks.push(chunk);
            body += data
          });
          req.on('end', async () => {
            try {
              //@ts-ignore
              const request = new Request(reqUrl, { method, body, headers: req.headers });
              const response = await this.handleHttpRequest(request);
              const headers = Object.fromEntries(response.headers)
              res.writeHead(200, {
                ...headers,
                "Connection":"close"
              });
              if(headers['content-type'] && headers['content-type'] === 'application/octet-stream'){
                const text = await response.arrayBuffer()
                res.end(Buffer.from(text));
              }else{
                const text = await response.text()
                res.end(text);
              }
            }catch (e){
              console.error("[ERROR]",e)
              res.writeHead(500, {
                ...getCorsHeader(),
                "Connection":"close"
              });
              const text = JSON.stringify({status:500})
              res.end(text);
            }
          });
        } else if (method === 'GET') {
          //@ts-ignore
          const request = new Request(reqUrl, { method, headers: req.headers });
          const response = await this.handleHttpRequest(request);
          const headers = Object.fromEntries(response.headers)

          res.writeHead(response.status, {
            ...headers,
            // "Connection":"close"
          });
          const contentType = headers['content-type']
          if(contentType
            &&(
            ['application/octet-stream',"application/wasm"].includes(contentType) ||
            contentType.indexOf("image/") === 0 ||
            contentType.indexOf("font/") === 0)
          ){
            const text = await response.arrayBuffer()
            res.end(Buffer.from(text));
          }else{
            const text = await response.text()
            res.end(text);
          }
        } else if (method === 'OPTIONS') {
          res.writeHead(200, {
            ...getCorsOptionsHeader(),
            // "Connection":"close"
          });
          res.end("");
        }else {
          console.warn('Method Not Allowed')
          res.writeHead(405, { 'Content-Type': 'text/plain' });
          res.end('Method Not Allowed');
        }
      });

      this.wsServer = new WebSocketServer({ server: this.httpServer });

      this.wsServer.on('connection', (ws) => {
        const connId = uuidv4();
        //@ts-ignore
        const connection = new WsConnection(connId, ws);
        MsgConnectionManager.getInstance().addMsgConn(connId, {
          id: connId,
          connection,
        });
        console.log(`[WsServer] on connection: `, connId);
        ws.on('message', async (msg: Buffer) => {
          console.log("[message]",msg.toString())
          const {action,payload} = JSON.parse(msg.toString())
          switch (action){
            case "Login":
              const token = payload.token
              MsgConnectionManager.getInstance().updateMsgConn(connId, {
                token
              });
              ws.send(Buffer.from(JSON.stringify({
                action:"Login",
                payload:{
                  token,
                  status:200
                }
              })))
              return
          }
          // const processor = BusinessLogicProcessor.getInstance(connId);
          // try {
          //   const pdu = new Pdu(msg);
          //   await processor.handleWsMsg(pdu);
          // } catch (err) {
          //   console.error(err);
          // }
        });

        ws.on('close', () => {
          MsgConnectionManager.getInstance().removeMsgConn(connId);
        });
      });

      this.httpServer.listen(this.port, () => {
        resolve();
      });
    });
  }
}
