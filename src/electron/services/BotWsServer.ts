import WebSocket from 'ws';
import * as net from 'net';
import { exec } from 'child_process';
import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';
import { currentTs1000 } from '../../worker/share/utils/utils';
import { AppArgvType } from '../utils/args';

export class BotWsServer {
  private port?: number;
  private socketServer?: WebSocket.Server;
  private ws?: WebSocket.WebSocket;
  private appArgs?: AppArgvType;
  private msgHandler?: { sendToRenderMsg: (action: string, payload?: any) => void; sendToMainMsg: (action: string, payload?: any) => void };
  setMsgHandler(msgHandler:{
                  sendToRenderMsg:(action:string,payload?:any)=>void,
                  sendToMainMsg:(action:string,payload?:any)=>void
                }){
    this.msgHandler = msgHandler
    return this
  }
  sendToClient(pdu: Pdu) {
    if (this.ws) {
      this.ws.send(pdu.getPbData());
    }
  }
  async start(appArgs: AppArgvType) {
    this.appArgs = appArgs
    const port = appArgs.waiServerWsPort!;

    // 检查端口是否被占用
    const isPortUsed = await this.isPortInUse(this.port!);

    if (isPortUsed) {
      console.log(`[BotWsServer] Port ${this.port} is in use. Killing the process...`);
      await this.killProcessUsingPort(this.port!);
    }
    const socketServer = (this.socketServer = new WebSocket.Server({ port }));
    socketServer.on('connection', ws => {
      this.ws = ws;
      console.log("[BotWsServer Client] connected ")
      this.msgHandler!.sendToMainMsg('clientConnected');
      ws.on('message', async (msg: string) => {
        const {action,payload} =JSON.parse(msg)
        console.log("[BotWsServer message]",action,payload)
        switch (action){
          case "login":
            ws.send(JSON.stringify({
              action,
              payload:{
                accountId:payload.accountId,
                ts:currentTs1000()
              }
            }))
            break
        }

      });
      ws.on('close', () => {
        console.log("[BotWsServer Client] disconnected ")
      });
    });

    console.log('[BotWsServer] is running on ws://localhost:' + port);
    return this
  }
  close() {
    console.log("[BotWsServer close]",this.socketServer,this.ws)
    if (this.socketServer) {
      if (this.ws) {
        this.ws.close();
        this.ws = undefined;
      }
      this.socketServer.close();
      this.socketServer = undefined;
    }
  }
  private isPortInUse(port: number): Promise<boolean> {
    return new Promise(resolve => {
      const server = net.createServer();
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(false);
      });

      server.listen(port);
    });
  }
  private async killProcessUsingPort(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(`lsof -i :${port} | awk 'NR!=1 {print $2}' | xargs kill -9`, error => {
        if (error) {
          console.error(`Failed to kill process on port ${port}:`, error);
          reject(error);
        } else {
          console.log(`Killed process on port ${port}`);
          resolve();
        }
      });
    });
  }
}
