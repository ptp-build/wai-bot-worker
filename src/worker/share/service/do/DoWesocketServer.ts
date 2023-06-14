import {Pdu} from '../../../../lib/ptp/protobuf/BaseMsg';
import {AuthSessionType} from '../User';
import {OtherNotify} from '../../../../lib/ptp/protobuf/PTPOther';
import {ERR} from '../../../../lib/ptp/protobuf/PTPCommon/types';
import {Environment, initEnv} from '../../../env';
import MsgDispatcher from './../../../share/service/MsgDispatcher';
import {ActionCommands} from '../../../../lib/ptp/protobuf/ActionCommands';
import {SendBotMsgReq, SendMsgRes} from '../../../../lib/ptp/protobuf/PTPMsg';
import {currentTs} from '../../utils/utils';
import {JSON_HEADERS} from "../../../setting";

interface AccountUser {
  websocket: WebSocket;
  authSession?: AuthSessionType;
  id: string;
  city: string | undefined | any;
  country: string | any;
}

// every 10 seconds
const healthCheckInterval = 10e3;

export class WebSocketDurableObject {
  accounts: Map<string, AccountUser>;
  pings: Map<string, number>;
  storage: DurableObjectStorage;
  dolocation: string;

  constructor(state: DurableObjectState, env: Environment) {
    initEnv(env);
    // We will put the WebSocket objects for each client into `websockets`
    this.accounts = new Map();
    this.pings = new Map();
    this.storage = state.storage;
    this.dolocation = '';

    this.scheduleNextAlarm(this.storage);
    this.getDurableObjectLocation().catch(console.error);
  }
  async handleApi(request:Request){
    const uri = new URL(request.url)
    let requestBody;
    let hasSent = false;

    if (uri.pathname.startsWith('/api/do/ws/sendBotMsgRes')) {
      requestBody = await request.json();
      let {pduBuf, toUid} = requestBody
      pduBuf = Buffer.from(pduBuf,'hex')
      this.accounts!.forEach((account, key) => {
        const {authUserId,chatId} = account.authSession
        console.log("=====>>>>> sendBotMsgRes 1",{authUserId,toUid},account)
        if (authUserId === toUid && !chatId) {
          try {
            account.websocket.send(pduBuf);
            hasSent = true;
          } catch (e) {
            console.error(e);
          }
        }
      });
      return new Response(null, { status: hasSent ? 200 : 404 });
    }
    if (uri.pathname.startsWith('/api/do/ws/sendChatGptMsg')) {
      requestBody = await request.json();
      let {pduBuf,chatId} = requestBody

      pduBuf = Buffer.from(pduBuf,'hex')
      const {senderId} = SendBotMsgReq.parseMsg(new Pdu(pduBuf));
      console.log("sendChatGptMsg",chatId,senderId,pduBuf)

      this.accounts!.forEach((account, key) => {
        const chatId1 = account.authSession?.chatId;
        console.log("=====>>>>> sendChatGptMsg 1",{chatId1,chatId})
        if (account.authSession?.chatId?.toString() === chatId.toString()) {
          try {
            account.websocket.send(pduBuf);
            hasSent = true;
          } catch (e) {
            console.error(e);
          }
        }
      });
      console.log("[sendChatGptMsg]",{hasSent})
      return new Response(null, { status: hasSent ? 200 : 404 });
    }
    if (uri.pathname.startsWith('/api/do/ws/__accounts')) {
      const accounts = []
      this.accounts.forEach((account, key) => {
        accounts.push(account)
      });
      return new Response(JSON.stringify(accounts), { status: 200,headers:JSON_HEADERS });
    }
    if (uri.pathname.startsWith('/api/do/ws/sendMessage')) {
      requestBody = await request.json();
      this.accounts.forEach((account, key) => {
        if (account.authSession?.authUserId === requestBody.toUserId && !account.authSession?.chatId) {
          console.log('[send]', account);
          try {
            account.websocket.send(
                new SendMsgRes({
                  replyText: requestBody.text,
                  senderId: requestBody.fromUserId,
                  chatId: requestBody.chatId,
                  date: currentTs(),
                })
                    .pack()
                    .getPbData()
            );
            hasSent = true;
          } catch (e) {
            console.error(e);
          }
        }
      });
      return new Response(null, { status: hasSent ? 200 : 404 });
    }
  }
  async fetch(request: Request) {
    console.log("[DO] fetch",request.url)
    const uri = new URL(request.url)
    if(uri.pathname.startsWith("/api")){
      return this.handleApi(request);
    }
    const requestMetadata = request.cf;
    let pair = new WebSocketPair();
    //@ts-ignore
    const [client, server] = Object.values(pair);

    // We're going to take pair[1] as our end, and return pair[0] to the client.
    //@ts-ignore
    await this.handleWebSocketSession(server, requestMetadata);
    // Now we return the other end of the pair to the client.
    return new Response(null, { status: 101, webSocket: client });
  }

  async handleWebSocketSession(webSocket: WebSocket, metadata: IncomingRequestCfProperties) {
    // Accept our end of the WebSocket. This tells the runtime that we'll be terminating the
    // WebSocket in JavaScript, not sending it elsewhere.
    webSocket.accept();

    // Create our session and add it to the accounts map.
    const accountId = crypto.randomUUID();
    const dispatcher = MsgDispatcher.getInstance(accountId);
    dispatcher.setWs(webSocket);

    // console.log('metadata', JSON.stringify(metadata));
    this.accounts.set(accountId, {
      id: accountId,
      city: metadata.city,
      country: metadata.country,
      websocket: webSocket,
    });

    webSocket.addEventListener('message', async msg => {
      try {
        const pdu = new Pdu(Buffer.from(msg.data));
        const dispatcher = MsgDispatcher.getInstance(accountId);
        switch (pdu.getCommandId()) {
          case ActionCommands.CID_AuthLoginReq:
            const res = await dispatcher.handleAuthLoginReq(pdu);
            console.log('CID_AuthLoginReq', res,this.accounts);
            if (res) {
              this.accounts.set(accountId, {
                ...this.accounts.get(accountId),
                authSession: res,
              });
            }
            return;
        }
        await MsgDispatcher.handleWsMsg(accountId, pdu);
      } catch (err) {
        console.error(err);
      }
    });

    // On "close" and "error" events, remove the WebSocket from the webSockets list
    let closeOrErrorHandler = () => {
      console.log('user', accountId);
      this.accounts.delete(accountId);
    };
    webSocket.addEventListener('close', closeOrErrorHandler);
    webSocket.addEventListener('error', closeOrErrorHandler);
  }

  // broadcast() broadcasts a message to all clients.
  broadcast(message: Buffer) {
    // Iterate over all the sessions sending them messages.
    this.accounts.forEach((user, key) => {
      try {
        user.websocket.send(message);
      } catch (err) {
        this.accounts.delete(key);
      }
    });
  }

  async getDurableObjectLocation() {
    const res = await fetch('https://workers.cloudflare.com/cf.json');
    const json = (await res.json()) as IncomingRequestCfProperties;
    // console.log('getDurableObjectLocation', JSON.stringify(json));
    this.dolocation = `${json.city} (${json.country})`;
  }

  scheduleNextAlarm(storage: DurableObjectStorage) {
    try {
      const alarmTime = Date.now() + healthCheckInterval;
      storage.setAlarm(alarmTime);
    } catch {
      console.log('Durable Objects Alarms not supported in Miniflare (--local mode) yet.');
    }
  }

  alarm() {
    this.broadcast(Buffer.from(new OtherNotify({ err: ERR.NO_ERROR }).pack().getPbData()));
    if (this.accounts.size) this.scheduleNextAlarm(this.storage);
  }
}
