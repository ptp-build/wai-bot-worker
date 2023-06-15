import { WaiRouter } from '../../worker/route';
import * as http from 'http';
import { getCorsHeader, getCorsOptionsHeader } from '../../worker/share/utils/utils';
import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';
import { UploadUserReq } from '../../lib/ptp/protobuf/PTPUser';
import { PbUser } from '../../lib/ptp/protobuf/PTPCommon';

export class HttpServer {
  private server?: http.Server;
  private port: number;
  private router: WaiRouter;

  constructor(port: number, router: WaiRouter) {
    this.port = port;
    this.router = router;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        const { url, method } = req;
        // let body = '';
        let chunks: Uint8Array[] = [];

        console.log(`${method} ${url}`)
        const reqUrl = `http://${req.headers.host}${url}`
        if (method === 'POST' || method === 'PUT') {
          req.on('data', (chunk:Uint8Array) => {
            chunks.push(chunk);
          });
          req.on('end', async () => {
            try {
              let body = Buffer.concat(chunks);

              //@ts-ignore
              const request = new Request(reqUrl, { method, body, headers: req.headers });
              const response = await this.router.handleRequest(request);
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
                res.end(Buffer.from(text));
              }
            }catch (e){
              console.error(e)
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
          const response = await this.router.handleRequest(request);
          res.writeHead(response.status, {
            ...Object.fromEntries(response.headers),
            "Connection":"close"
          });
          const text = await response.text()
          res.end(text);
        } else if (method === 'OPTIONS') {
          res.writeHead(200, {
            ...getCorsOptionsHeader(),
            "Connection":"close"
          });
          res.end("");
        }else {
          console.warn('Method Not Allowed')
          res.writeHead(405, { 'Content-Type': 'text/plain' });
          res.end('Method Not Allowed');
        }
      });

      this.server.listen(this.port, () => {
        resolve();
      });
    });
  }
}
