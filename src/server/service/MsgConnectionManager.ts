import { SendBotMsgReq, SendMsgRes } from '../../lib/ptp/protobuf/PTPMsg';
import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';
import { JSON_HEADERS } from '../../worker/setting';
import { currentTs } from '../../worker/share/utils/utils';
import { AccountUser } from '../../worker/share/service/do/DoWesocketServer';
import { ENV } from '../../worker/env';
import MsgConnChatGptBotWorkerManager from './MsgConnChatGptBotWorkerManager';

let currentInstance:MsgConnectionManager;

export default class MsgConnectionManager {
  private accounts: Map<string, AccountUser>;
  private addressAccountMap: Map<string, string[]>;
  static getInstance(){
    if(!currentInstance){
      currentInstance = new MsgConnectionManager()
    }
    return currentInstance
  }
  constructor() {
    this.accounts = new Map();
    this.addressAccountMap = new Map();
  }
  addUserAccountMap(id:string,account:AccountUser){
    if(account.authSession?.authUserId){
      const {address} = account.authSession
      let accounts:string[] = []
      if(this.addressAccountMap.has(address)){
        accounts = this.addressAccountMap.get(address)!
      }
      if(!accounts.includes(id)){
        accounts.push(id)
      }
      this.addressAccountMap.set(address,accounts)
    }
  }
  addMsgConn(id:string,account:AccountUser){
    this.accounts.set(id,account)
    this.addUserAccountMap(id,account)
  }
  updateMsgConn(id:string,account:Partial<AccountUser>){
    const account1 = this.getMsgConn(id)
    Object.assign(account1,account)
    this.addUserAccountMap(id,this.getMsgConn(id)!)
  }
  getMsgConn(id:string,){
    return this.accounts.get(id)
  }
  removeMsgConn(id:string,){
    const account=this.accounts.get(id)
    if(account){
      if(undefined !== MsgConnChatGptBotWorkerManager.getInstance().getStatus(id)){
        MsgConnChatGptBotWorkerManager.getInstance().remove(id)
      }
      this.accounts.delete(id)
      if(account.authSession){
        const {address} = account.authSession
        if(this.addressAccountMap.has(address)){
          const accounts = this.addressAccountMap.get(address)!
          if(accounts.includes(address)){
            this.addressAccountMap.set(address,accounts.filter(id1=>id!== id1))
          }
        }
      }
    }
  }
  async sendBotMsgRes(toUid:string,pduBuf:Buffer){
    let hasSent = false
    this.accounts!.forEach((account, key) => {
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

    if (uri.pathname.startsWith('/api/do/ws/sendBotMsgRes')) {
      requestBody = await request.json();
      let {pduBuf, toUid} = requestBody
      pduBuf = Buffer.from(pduBuf,'hex')
      const {text,streamStatus} = SendBotMsgReq.parseMsg(new Pdu(pduBuf))
      console.log(">>>>> ",text,streamStatus)
      this.accounts!.forEach((account, key) => {
        const {authUserId,chatId} = account.authSession!
        console.log("=====>>>>> sendBotMsgRes 1",{authUserId,toUid})
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
      pduBuf = Buffer.from(pduBuf,'hex')
      const accountUser = this.accounts.get(msgConnId)
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
      this.accounts.forEach((account, key) => {
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
        addressAccountMap:Object.fromEntries(this.addressAccountMap)
      }), { status: 200,headers:JSON_HEADERS });
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
}
