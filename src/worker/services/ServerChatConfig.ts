import BaseObject from "./BaseObject";
import ServerSession from "./ServerSession";
import KvCache from "./kv/KvCache";

export type ChatConfigKey = "enableMultipleQuestion"

export default class ServerChatConfig extends BaseObject{
  private chatId: string;
  private keyPrefix: string;
  constructor(session:ServerSession,chatId:string) {
    super(session)
    this.chatId = chatId
    this.keyPrefix = `ChatConfig_${this.getSession().getAccountAddress()}_${this.chatId}`
  }

  async getConfig(key:ChatConfigKey){
    return await KvCache.getInstance().get(`${this.keyPrefix}_${key}`) || null
  }

  async setConfig(key:ChatConfigKey,value:any){
    return await KvCache.getInstance().put(`${this.keyPrefix}_${key}`,value)
  }

  async delConfig(key:ChatConfigKey){
    return await KvCache.getInstance().delete(`${this.keyPrefix}_${key}`)
  }

  async isEnableMultipleQuestion(){
    return await this.getConfig("enableMultipleQuestion") === "true"
  }
}
