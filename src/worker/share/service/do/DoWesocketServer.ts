import { Pdu } from '../../../../lib/ptp/protobuf/BaseMsg';
import { AuthSessionType } from '../User';
import { OtherNotify } from '../../../../lib/ptp/protobuf/PTPOther';
import { ERR } from '../../../../lib/ptp/protobuf/PTPCommon/types';
import { Environment, initEnv } from '../../../env';
import MsgDispatcher from './../../../share/service/MsgDispatcher';
import { ActionCommands } from '../../../../lib/ptp/protobuf/ActionCommands';
import MsgConnectionManager from '../../../../server/service/MsgConnectionManager';
import MsgConnectionApiHandler from '../../../../server/service/MsgConnectionApiHandler';

export interface AccountUser {
  websocket: WebSocket;
  authSession?: AuthSessionType;
  id: string;
  city: string | undefined | any;
  country: string | any;
}

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
    MsgDispatcher.getInstance(connId);

    MsgConnectionManager.getInstance().addMsgConn(connId,{
      id: connId,
      city: metadata.city,
      country: metadata.country,
      websocket: webSocket,
    })

    webSocket.addEventListener('message', async msg => {
      try {
        const pdu = new Pdu(Buffer.from(msg.data));
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
