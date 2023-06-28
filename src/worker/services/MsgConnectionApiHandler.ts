import {JSON_HEADERS} from '../setting';
import MsgConnChatGptBotWorkerManager from './MsgConnChatGptBotWorkerManager';
import MsgConnectionManager from './MsgConnectionManager';

export const API_HOST_INNER = "http://127.0.0.1:8080/api/server"

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
      })
    });
    const chatGptBotWorkers = Object.fromEntries(MsgConnChatGptBotWorkerManager.getInstance().getStatusMap());
    const addressAccountMap = Object.fromEntries(this.msgConnManager.getAddressAccountMap());
    return {
      accounts,
      chatGptBotWorkers,
      addressAccountMap
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
  async fetch(request:Request){
    const uri = new URL(request.url)
    let requestBody:any;
    let hasSent = false;
    if (uri.pathname.startsWith('/api/server/__accounts')) {
      return new Response(JSON.stringify(await this.getOnlineAccounts()), { status: 200,headers:JSON_HEADERS });
    }
  }
}
