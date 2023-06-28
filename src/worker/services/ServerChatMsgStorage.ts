import MsgTable from "../models/mysql/MsgTable";
import KvCache from "./kv/KvCache";
import {NewMessage} from "../../types";
import BaseObject from "./BaseObject";
import ServerSession from "./ServerSession";
import { currentTs } from '../../utils/time';

export default class ServerChatMsgStorage extends BaseObject{
  private tableMsg: MsgTable;
  private kvMsg: KvCache;
  private enableMysql:boolean
  private keyPrefix: string;
  private chatId: string;
  constructor(session:ServerSession,chatId:string) {
    super(session)
    this.chatId = chatId;
    this.tableMsg = new MsgTable()
    this.kvMsg = KvCache.getInstance()
    this.enableMysql = false
    this.keyPrefix = `Chat_MSG_${this.getSession().getUserId()}_${this.chatId}`
  }
  async deleteMessages(chatId:string,ids:number[]){
    for (let i = 0; i < ids.length; i++) {
      if(this.enableMysql){
        await this.tableMsg.deleteRow(chatId, ids[i])
      }else{
        await this.kvMsg.delete(`${this.keyPrefix}_${ids[i]}`)
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
    if(this.enableMysql){
      await this.tableMsg.save(msg)
    }else{
      await this.kvMsg.put(`${this.keyPrefix}_${msg.msgId}`,msg)
    }
  }
  async updateMessage(msg:Partial<NewMessage>){
    if(this.enableMysql){
      await this.tableMsg.update(msg)
    }else{
      const str = await this.kvMsg.get(`${this.keyPrefix}_${msg.msgId}`)
      let msg1 = {}
      if(str){
        msg1 = str
      }
      await this.kvMsg.put(`${this.keyPrefix}_${msg.msgId}`,{
        ...msg1,
        ...msg
      })
    }
  }

  async getRow(msgId:number){
    if(this.enableMysql){
      return await this.tableMsg.getRow(this.chatId,msgId)
    }else{
      const str = await this.kvMsg.get(`${this.keyPrefix}_${msgId}`)
      return str ? str:null
    }
  }
}
