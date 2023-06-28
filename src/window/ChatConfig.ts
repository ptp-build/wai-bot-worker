import KvCache from "../worker/services/kv/KvCache";
import {UserIdFirstBot} from "../setting";

export type ChatConfigKey = "enableMultipleQuestion"

export default class ChatConfig{
  private chatId: string;
  constructor(chatId:string) {
    this.chatId = chatId
  }
  static getMasterConfig():ChatConfig{
    return new ChatConfig(UserIdFirstBot)
  }
  async getConfig(key:ChatConfigKey){
    return await KvCache.getInstance().get(`ChatConfig_${this.chatId}_${key}`) || null
  }

  async setConfig(key:ChatConfigKey,value:any){
    return await KvCache.getInstance().put(`ChatConfig_${this.chatId}_${key}`,value)
  }

  async delConfig(key:ChatConfigKey){
    return await KvCache.getInstance().delete(`ChatConfig_${this.chatId}_${key}`)
  }

  static async isEnableMultipleQuestion(chatId:string){
    return await new ChatConfig(chatId).getConfig("enableMultipleQuestion") === "true"
  }
}
