import { AccountUser } from '../../worker/share/service/do/DoWesocketServer';
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
  getMsgConnMap(){
    return this.accounts
  }

  getAddressAccountMap(){
    return this.addressAccountMap
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
  broadcast(message:Buffer){
    MsgConnectionManager.getInstance().getMsgConnMap().forEach((msgConn, _) => {
      try {
        msgConn.websocket.send(message);
      } catch (err) {
        console.error("[broadcast] error",err)
      }
    });
  }
  broadcastAlarm(message:Buffer){
    MsgConnectionManager.getInstance().getMsgConnMap().forEach((msgConn, connId) => {
      try {
        msgConn.websocket.send(message);
      } catch (err) {
        msgConn.websocket.close()
      }
    });
  }
  sendBuffer(msgConnId:string,message:Buffer){
    const msgConn = MsgConnectionManager.getInstance().getMsgConn(msgConnId)
    if(msgConn && msgConn.websocket){
      msgConn.websocket.send(message)
    }
  }
}
