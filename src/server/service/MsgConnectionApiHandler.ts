import { SendBotMsgReq, SendMsgRes } from '../../lib/ptp/protobuf/PTPMsg';
import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';
import { JSON_HEADERS } from '../../worker/setting';
import { currentTs } from '../../worker/share/utils/utils';
import MsgConnChatGptBotWorkerManager from './MsgConnChatGptBotWorkerManager';
import MsgConnectionManager from './MsgConnectionManager';

let currentInstance:MsgConnectionApiHandler;

export default class MsgConnectionApiHandler {
  private msgConnManager: MsgConnectionManager;
  static getInstance(){
    if(!currentInstance){
      currentInstance = new MsgConnectionApiHandler()
    }
    return currentInstance
  }

  constructor() {
    this.msgConnManager = MsgConnectionManager.getInstance()
  }

  async sendBotMsgRes(toUid:string,pduBuf:Buffer){
    let hasSent = false
    const {msgConnManager} = this
    msgConnManager.getMsgConnMap().forEach((account, key) => {
      const {authUserId,chatId} = account.authSession!
      // console.log("=====>>>>> sendBotMsgRes 1",{authUserId,toUid})
      if (authUserId === toUid && !chatId) {
        try {
          account.websocket.send(pduBuf);
          hasSent = true;
        } catch (e) {
          console.error(e);
        }
      }
    });
    return hasSent
  }
  async fetch(request:Request){
    const uri = new URL(request.url)
    let requestBody:any;
    let hasSent = false;
    const msgConnManager = MsgConnectionManager.getInstance()
    if (uri.pathname.startsWith('/api/do/ws/sendBotMsgRes')) {
      requestBody = await request.json();
      let {pduBuf, toUid} = requestBody
      pduBuf = Buffer.from(pduBuf,'hex')
      const {text,streamStatus} = SendBotMsgReq.parseMsg(new Pdu(pduBuf))
      console.log(">>>>> ",text,streamStatus)
      msgConnManager.getMsgConnMap().forEach((account, connId) => {
        const {authUserId,chatId} = account.authSession!
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
      let {pduBuf,msgConnId} = requestBody
      // this.sendBotMsgRes()

      pduBuf = Buffer.from(pduBuf,'hex')
      const accountUser = msgConnManager.getMsgConnMap().get(msgConnId)
      if(accountUser){
        try {
          accountUser.websocket.send(pduBuf)
          hasSent = true
        }catch (e){
          hasSent = false
        }
      }
      return new Response(null, { status: hasSent ? 200 : 404 });
    }
    if (uri.pathname.startsWith('/api/do/ws/__accounts')) {
      const accounts:any[] = []
      msgConnManager.getMsgConnMap().forEach((account, key) => {
        accounts.push({
          authSession:account.authSession,
          id: account.id,
          city:account.city,
          country:account.country
        })
      });
      return new Response(JSON.stringify({
        accounts,
        chatGptBotWorkers:Object.fromEntries(MsgConnChatGptBotWorkerManager.getInstance().getStatusMap()),
        addressAccountMap:Object.fromEntries(msgConnManager.getAddressAccountMap())
      }), { status: 200,headers:JSON_HEADERS });
    }
    if (uri.pathname.startsWith('/api/do/ws/sendMessage')) {
      requestBody = await request.json();
      msgConnManager.getMsgConnMap().forEach((account, key) => {
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
}
