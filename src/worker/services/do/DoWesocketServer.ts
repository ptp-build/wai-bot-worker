import { Environment, initEnv } from '../../env';
import MsgConnectionApiHandler from '../MsgConnectionApiHandler';
import MsgConnectionManager from '../MsgConnectionManager';
import BusinessLogicProcessor from '../BusinessLogicProcessor';
import { ActionCommands } from '../../../lib/ptp/protobuf/ActionCommands';
import { Pdu } from '../../../lib/ptp/protobuf/BaseMsg';
import { OtherNotify } from '../../../lib/ptp/protobuf/PTPOther';
import { ERR } from '../../../lib/ptp/protobuf/PTPCommon/types';
import { WsDoConnection } from './WsDoConnection';

const healthCheckInterval = 10e3;

export class WebSocketDurableObject {
  pings: Map<string, number>;
  storage: DurableObjectStorage;
  dolocation: string;

  constructor(state: DurableObjectState, env: Environment) {
    initEnv(env);
    this.pings = new Map();
    //@ts-ignore
    this.storage = state.storage;
    this.dolocation = '';

    this.scheduleNextAlarm(this.storage);
    this.getDurableObjectLocation().catch(console.error);
  }

  async fetch(request: Request) {
    console.log("[DO] fetch",request.url)
    const uri = new URL(request.url)
    if(uri.pathname.startsWith("/api")){
      return MsgConnectionApiHandler.getInstance().fetch(request);
    }
    //@ts-ignore
    const requestMetadata = request.cf;
    let pair = new WebSocketPair();
    //@ts-ignore
    const [client, server] = Object.values(pair);
    //@ts-ignore
    await this.handleWebSocketSession(server, requestMetadata);
    //@ts-ignore
    return new Response(null, { status: 101, webSocket: client });
  }

  async handleWebSocketSession(webSocket: WebSocket, metadata: IncomingRequestCfProperties) {
    //@ts-ignore
    webSocket.accept();
    const connId = crypto.randomUUID();
    //@ts-ignore
    const connection = new WsDoConnection(connId,webSocket)
    MsgConnectionManager.getInstance().addMsgConn(connId,{
      id: connId,
      city: metadata.city,
      country: metadata.country,
      connection,
    })

    webSocket.addEventListener('message', async msg => {
      const processor = BusinessLogicProcessor.getInstance(connId);
      try {
        const pdu = new Pdu(Buffer.from(msg.data));
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

    let closeOrErrorHandler = () => {
      console.log('[CLOSE]', connId);
      MsgConnectionManager.getInstance().removeMsgConn(connId)
    };
    webSocket.addEventListener('close', closeOrErrorHandler);
    webSocket.addEventListener('error', closeOrErrorHandler);
  }

  async getDurableObjectLocation() {
    const res = await fetch('https://workers.cloudflare.com/cf.json');
    const json = (await res.json()) as IncomingRequestCfProperties;
    this.dolocation = `${json.city} (${json.country})`;
  }

  scheduleNextAlarm(storage: DurableObjectStorage) {
    try {
      const alarmTime = Date.now() + healthCheckInterval;
      //@ts-ignore
      storage.setAlarm(alarmTime);
    } catch {
      console.log('Durable Objects Alarms not supported in Miniflare (--local mode) yet.');
    }
  }

  alarm() {
    MsgConnectionManager.getInstance().broadcastAlarm(Buffer.from(new OtherNotify({ err: ERR.NO_ERROR }).pack().getPbData()));
    if (MsgConnectionManager.getInstance().getMsgConnMap().size) this.scheduleNextAlarm(this.storage);
  }
}
