import { SendMsgRes } from '../../lib/ptp/protobuf/PTPMsg';
import { JSON_HEADERS } from '../setting';
import { currentTs } from '../share/utils/utils';
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

  async getOnlineAccounts(){
    const accounts:any[] = []
    this.msgConnManager.getMsgConnMap().forEach((account, key) => {
      accounts.push({
        authSession:account.session,
        id: account.id,
        city:account.city,
        country:account.country
      })
    });
    return {
      accounts,
      chatGptBotWorkers:Object.fromEntries(MsgConnChatGptBotWorkerManager.getInstance().getStatusMap()),
      addressAccountMap:Object.fromEntries(this.msgConnManager.getAddressAccountMap())
    }
  }
  async sendBotMsgRes(toUid:string,pduBuf:Buffer){
    let hasSent = false
    const {msgConnManager} = this
    msgConnManager.getMsgConnMap().forEach((account, key) => {
      const {authUserId,chatId} = account.session!
      if (authUserId === toUid && !chatId) {
        try {
          account.connection.send(pduBuf);
          hasSent = true;
        } catch (e) {
          console.error(e);
        }
      }
    });
    return hasSent
  }
  async sendChatGptMsg(msgConnId:string,pduBuf:Buffer){
    let hasSent = false
    const accountUser = this.msgConnManager.getMsgConnMap().get(msgConnId)
    if(accountUser){
      try {
        accountUser.connection.send(pduBuf)
        hasSent = true
      }catch (e){
        hasSent = false
      }
    }
    return hasSent
  }

  async sendMessage(requestBody:{toUserId:string,text:string,fromUserId:string,chatId:string}){
    let hasSent = false;
    this.msgConnManager.getMsgConnMap().forEach((account, key) => {
      if (account.session?.authUserId === requestBody.toUserId && !account.session?.chatId) {
        console.log('[send]', account);
        try {
          account.connection.send(
            Buffer.from(new SendMsgRes({
              replyText: requestBody.text,
              senderId: requestBody.fromUserId,
              chatId: requestBody.chatId,
              date: currentTs(),
            })
              .pack()
              .getPbData())
          );
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
      hasSent = await this.sendBotMsgRes(toUid,pduBuf)
      return new Response(null, { status: hasSent ? 200 : 404 });
    }
    if (uri.pathname.startsWith('/api/do/ws/sendChatGptMsg')) {
      requestBody = await request.json();
      let {pduBuf,msgConnId} = requestBody
      pduBuf = Buffer.from(pduBuf,'hex')
      hasSent = await this.sendChatGptMsg(msgConnId,pduBuf)
      return new Response(null, { status: hasSent ? 200 : 404 });
    }

    if (uri.pathname.startsWith('/api/do/ws/sendMessage')) {
      requestBody = await request.json();
      hasSent = await this.sendMessage(requestBody)
      return new Response(null, { status: hasSent ? 200 : 404 });
    }
    if (uri.pathname.startsWith('/api/do/ws/__accounts')) {
      return new Response(JSON.stringify(this.getOnlineAccounts()), { status: 200,headers:JSON_HEADERS });
    }
  }
}
