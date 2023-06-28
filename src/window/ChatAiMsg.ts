import KvCache from "../worker/services/kv/KvCache";
import ChatConfig from "./ChatConfig";

export default class ChatAiMsg{
  private chatId: string;
  constructor(chatId:string) {
    this.chatId = chatId
  }

  async get(askMsgId:Number){
    const aiMsgId = await KvCache.getInstance().get(`ChatAiMsg_${this.chatId}_${askMsgId}`);
    if(aiMsgId){
      return Number(aiMsgId)
    }else{
      return null
    }
  }

  async save(askMsgId:number,aiMsgId:number){
    return await KvCache.getInstance().put(`ChatAiMsg_${this.chatId}_${askMsgId}`,aiMsgId.toString())
  }

  async saveAskList(msgIdList:number[]){
    await KvCache.getInstance().put(`AskList_${this.chatId}`,msgIdList)
  }

  async getAskList():Promise<number[]>{
    return await KvCache.getInstance().get(`AskList_${this.chatId}`) || []
  }

  async addAskList(msgId:number){
    let msgList = await this.getAskList()
    msgList.push(msgId)
    await KvCache.getInstance().put(`AskList_${this.chatId}`,msgList)
  }


  async deleteAskList(ids?:number[]){
    if(ids){
      let msgList = await this.getAskList()
      msgList = msgList.filter(id=>!ids.includes(id))
      await KvCache.getInstance().put(`AskList_${this.chatId}`,msgList)
    }else{
      await KvCache.getInstance().delete(`AskList_${this.chatId}`)
    }
  }

  async getAskListFinished(msgId:number):Promise<number[]>{
    return await KvCache.getInstance().get(`AskList_finished_${this.chatId}_${msgId}`)
  }

  async finishChatGptReply(payload:{msgId:number,chatId:string}){
    const enabled = await ChatConfig.isEnableMultipleQuestion(payload.chatId)
    if(enabled){
      let msgList = await this.getAskList()
      if(msgList.length > 0){
        await KvCache.getInstance().put(`AskList_finished_${payload.chatId}_${payload.msgId}`,msgList)
        await KvCache.getInstance().delete(`AskList_${payload.chatId}`)
      }
    }
  }
}
