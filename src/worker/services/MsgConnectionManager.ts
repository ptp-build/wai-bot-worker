import MsgConnChatGptBotWorkerManager, {MsgConnChatGptBotWorkerStatus} from './MsgConnChatGptBotWorkerManager';
import {AccountUser} from "../../types";

let currentInstance:MsgConnectionManager;


export default class MsgConnectionManager {
  private accountUsers: Map<string, AccountUser>;
  private addressAccountMap: Map<string, string[]>;
  static getInstance(){
    if(!currentInstance){
      currentInstance = new MsgConnectionManager()
    }
    return currentInstance
  }
  constructor() {
    this.accountUsers = new Map();
    this.addressAccountMap = new Map();
  }
  addUserAccountMap(id:string,account:AccountUser){
    if(account.session?.authUserId){
      const {address} = account.session
      let accountUsers:string[] = []
      if(this.addressAccountMap.has(address)){
        accountUsers = this.addressAccountMap.get(address)!
      }
      if(!accountUsers.includes(id)){
        accountUsers.push(id)
      }
      this.addressAccountMap.set(address,accountUsers)
    }
  }
  addMsgConn(id:string,account:AccountUser){
    this.accountUsers.set(id,account)
    this.addUserAccountMap(id,account)
  }

  updateMsgConn(id:string,account:Partial<AccountUser>){
    const account1 = this.getMsgConn(id)
    Object.assign(account1,account)
    this.addUserAccountMap(id,this.getMsgConn(id)!)
  }
  getMsgConn(id:string,){
    return this.accountUsers.get(id)
  }
  getMsgConnMap(){
    return this.accountUsers
  }

  getAddressAccountMap(){
    return this.addressAccountMap
  }
  removeMsgConn(id:string,){
    const account=this.accountUsers.get(id)
    if(account){
      if(undefined !== MsgConnChatGptBotWorkerManager.getInstance().getStatus(id)){
        MsgConnChatGptBotWorkerManager.getInstance().setBotStatus(id,MsgConnChatGptBotWorkerStatus.OFFLINE)
      }
      this.accountUsers.delete(id)
      if(account.session){
        const {address} = account.session
        if(this.addressAccountMap.has(address)){
          const accountUsers = this.addressAccountMap.get(address)!
          if(accountUsers.includes(address)){
            this.addressAccountMap.set(address,accountUsers.filter(id1=>id!== id1))
          }
        }
      }
    }
  }
  broadcast(message:Buffer){
    MsgConnectionManager.getInstance().getMsgConnMap().forEach((msgConn, _) => {
      try {
        msgConn.connection.send(message);
      } catch (err) {
        console.error("[broadcast] error",err)
      }
    });
  }
  broadcastAlarm(message:Buffer){
    MsgConnectionManager.getInstance().getMsgConnMap().forEach((msgConn, connId) => {
      try {
        msgConn.connection.send(message);
      } catch (err) {
        msgConn.connection.close()
      }
    });
  }
  sendMsgByToken(token:string,msg:object){
    const message = Buffer.from(JSON.stringify(msg))
    MsgConnectionManager.getInstance().getMsgConnMap().forEach((msgConn, connId) => {
      if(msgConn.token === token){
        msgConn.connection.send(message)
      }
    });
  }
  sendBuffer(msgConnId:string,message:Buffer){
    const msgConn = MsgConnectionManager.getInstance().getMsgConn(msgConnId)
    if(msgConn && msgConn.connection){
      msgConn.connection.send(message)
    }
  }
}
