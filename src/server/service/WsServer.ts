import * as WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { BaseServer } from './BaseServer';
import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';
import { ActionCommands } from '../../lib/ptp/protobuf/ActionCommands';
import MsgConnectionManager from '../../worker/services/MsgConnectionManager';
import { WsConnection } from './BaseConnection';
import BusinessLogicProcessor from '../../worker/services/BusinessLogicProcessor';

export class WsServer extends BaseServer {
  private wsServer: WebSocket.Server;
  private connections: Map<string, WsConnection> = new Map();

  constructor(port: number) {
    super(port);
    this.wsServer = new WebSocket.Server({ port: this.port });
  }

  start(): void {
    this.wsServer.on('connection', ws => {
      const connId = uuidv4();
      //@ts-ignore
      const connection = new WsConnection(connId,ws)
      this.connections.set(connId, connection);
      MsgConnectionManager.getInstance().addMsgConn(connId,{
        id: connId,
        city: "",
        country: "",
        connection,
      })
      console.log(`[WsServer] on connection: `, connId);
      ws.on('message', async (msg: Buffer) => {
        const processor = BusinessLogicProcessor.getInstance(connId);
        try {
          const pdu = new Pdu(Buffer.from(msg));

          switch (pdu.getCommandId()) {
            case ActionCommands.CID_AuthLoginReq:
              const res = await processor.handleAuthLoginReq(pdu);
              if (res) {
                MsgConnectionManager.getInstance().updateMsgConn(connId,{
                  session: res,
                })
              }
              return;
          }
          await processor.handleWsMsg(pdu);
        } catch (err) {
          console.error(err);
        }
      });

      ws.on('close', () => {
        this.connections.delete(connId);
        MsgConnectionManager.getInstance().removeMsgConn(connId)
      });
    });
  }
}
