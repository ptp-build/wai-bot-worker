import {NewMessage} from "../types";
import MsgTable from "../worker/models/mysql/MsgTable";
import {currentTs} from "../utils/utils";
import KvCache from "../worker/services/kv/KvCache";
import WorkerAccount from "./woker/WorkerAccount";
import DbStorage from "../worker/services/db/DbStorage";
import {MysqlClient} from "../worker/services/db/MysqlClient";

export default class MainChatMsgStorage{
  private tableMsg: MsgTable;
  private kvMsg: KvCache;
  constructor() {
    this.tableMsg = new MsgTable()
    this.kvMsg = KvCache.getInstance()
  }
  async isEnableMysql(){
    const workerAccount = await WorkerAccount.getMasterWorkerAccount();
    let enableMysql;
    if(workerAccount){
      const {mysqlMsgStorageDsn} = workerAccount
      if(mysqlMsgStorageDsn){
        enableMysql = true
        const t = mysqlMsgStorageDsn.split(" ")
        const [host,port] = t[0].split(":")
        const [user,password] = t[1].split(":")
        const database = t[2]
        if(!DbStorage.getInstance().getHandler()){
          DbStorage.getInstance().setHandler(new MysqlClient().setConfig({
            database,
            host,
            password,
            user,
            port:port ? Number(port) : 3306
          }))
        }
      }else{
        enableMysql = false
      }
    }
    return enableMysql
  }
  async deleteMessages(chatId:string,ids:number[]){
    for (let i = 0; i < ids.length; i++) {
      if(await this.isEnableMysql()){
        await this.tableMsg.deleteRow(chatId, ids[i])
      }else{
        await this.kvMsg.delete("Chat_MSG_"+chatId+"_"+ids[i])
      }
    }
  }
  async addNewMessage(msg:NewMessage){
    if(!msg.msgDate){
      msg.msgDate = currentTs();
    }
    if(msg.isOutgoing === undefined){
      msg.isOutgoing = false
    }

    if(msg.senderId === undefined){
      msg.senderId = ""
    }

    if(msg.inlineButtons === undefined){
      msg.inlineButtons = []
    }
    if(msg.entities === undefined){
      msg.entities = []
    }
    if(await this.isEnableMysql()){
      await this.tableMsg.save(msg)
    }else{
      await this.kvMsg.put("Chat_MSG_"+msg.chatId+"_"+msg.msgId,msg)
    }
  }
  async updateMessage(msg:Partial<NewMessage>){
    if(await this.isEnableMysql()){
      await this.tableMsg.update(msg)
    }else{
      const msg1 = await this.kvMsg.get("Chat_MSG_"+msg.chatId+"_"+msg.msgId)
      await this.kvMsg.put("Chat_MSG_"+msg.chatId+"_"+msg.msgId,{
        ...msg1,
        ...msg
      })
    }
  }

  async getRow(chatId:string,msgId:number){
    if(await this.isEnableMysql()){
      return await this.tableMsg.getRow(chatId,msgId)
    }else{
      const str = await this.kvMsg.get("Chat_MSG_"+chatId+"_"+msgId)
      return str ? str:null
    }
  }
}
