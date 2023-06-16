import * as WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { WsClient } from './Client';
import { Server } from './Server';
import MsgDispatcher from '../../worker/share/service/MsgDispatcher';
import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';
import { ActionCommands } from '../../lib/ptp/protobuf/ActionCommands';
import MsgConnectionManager from './MsgConnectionManager';

export class WsServer extends Server {
  private wsServer: WebSocket.Server;
  private clients: Map<string, WsClient> = new Map();

  constructor(port: number) {
    super(port);
    this.wsServer = new WebSocket.Server({ port: this.port });
  }

  start(): void {
    this.wsServer.on('connection', ws => {
      const connId = uuidv4();
      // @ts-ignore
      const client = new WsClient(connId, ws);
      this.clients.set(connId, client);
      const dispatcher = MsgDispatcher.getInstance(connId);

      MsgConnectionManager.getInstance().addMsgConn(connId,{
        id: connId,
        city: "",
        country: "",
        //@ts-ignore
        websocket: ws,
      })
      console.log(`[WsServer] on connection: `, connId,this.clients);
      ws.on('message', async (msg: Buffer) => {
        try {
          const pdu = new Pdu(Buffer.from(msg));
          const dispatcher = MsgDispatcher.getInstance(connId);
          switch (pdu.getCommandId()) {
            case ActionCommands.CID_AuthLoginReq:
              const res = await dispatcher.handleAuthLoginReq(pdu);
              if (res) {
                MsgConnectionManager.getInstance().updateMsgConn(connId,{
                  authSession: res,
                })
              }
              return;
          }
          await MsgDispatcher.handleWsMsg(connId, pdu);
        } catch (err) {
          console.error(err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(connId);
        MsgConnectionManager.getInstance().removeMsgConn(connId)
      });
    });
  }
}
