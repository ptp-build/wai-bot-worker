import KvCache from "./kv/KvCache";
import ServerSession from "./ServerSession";
import BaseObject from "./BaseObject";
import ServerChatConfig from "./ServerChatConfig";

export default class ServerChatAiMsg extends BaseObject{
  private chatId: string;
  private keyPrefix: string;
  private keyPrefixAskList: string;
  private keyPrefixAskListFinish: any;
  private keyPrefixIsAsking: string;
  constructor(session:ServerSession,chatId:string) {
    super(session)
    this.chatId = chatId
    this.keyPrefix = `ChatAiMsg_${this.getSession().getUserId()}_${this.chatId}`
    this.keyPrefixIsAsking = `ChatAiMsg_isAsking_8_${this.getSession().getUserId()}`

    this.keyPrefixAskList = `AskList_${this.getSession().getUserId()}_${this.chatId}`
    this.keyPrefixAskListFinish = `AskList_finished_${this.getSession().getUserId()}_${this.chatId}`

  }

  async get(askMsgId:Number){
    const aiMsgId = await KvCache.getInstance().get(`${this.keyPrefix}_${askMsgId}`);
    if(aiMsgId){
      return Number(aiMsgId)
    }else{
      return null
    }
  }

  async save(askMsgId:number,aiMsgId:number){
    return await KvCache.getInstance().put(`${this.keyPrefix}_${askMsgId}`,aiMsgId.toString())
  }

  async saveAskList(msgIdList:number[]){
    await KvCache.getInstance().put(`${this.keyPrefixAskList}`,msgIdList)
  }

  async getAskList():Promise<number[]>{
    return  await KvCache.getInstance().get(`${this.keyPrefixAskList}`)
  }

  async addAskList(msgId:number){
    let msgList = await this.getAskList()
    msgList.push(msgId)
    await KvCache.getInstance().put(`${this.keyPrefixAskList}`,msgList)
  }


  async deleteAskList(ids?:number[]){
    if(ids){
      let msgList = await this.getAskList()
      msgList = msgList.filter(id=>!ids.includes(id))
      await KvCache.getInstance().put(`${this.keyPrefixAskList}`,msgList)
    }else{
      await KvCache.getInstance().delete(`${this.keyPrefixAskList}`)
    }
  }

  async getAskListFinished(msgId:number):Promise<number[]>{
    return await KvCache.getInstance()
      .get(`${this.keyPrefixAskListFinish}_${msgId}`)
  }

  async finishChatGptReply(payload:{msgId:number}){
    const enabled = await new ServerChatConfig(this.getSession(),this.chatId).isEnableMultipleQuestion()
    if(enabled){
      let msgList = await this.getAskList()
      if(msgList.length > 0){
        await KvCache.getInstance().put(`${this.keyPrefixAskListFinish}_${payload.msgId}`,msgList)
        await KvCache.getInstance().delete(`${this.keyPrefixAskList}_${this.chatId}`)
      }
    }
    return this
  }

  async isAsking() {
    console.log("isAsking",this.keyPrefixIsAsking)
    return false
    // return await KvCache.getInstance().get(`${this.keyPrefixIsAsking}`)
  }

  async cancelIsAsking() {
    await KvCache.getInstance().delete(`${this.keyPrefixIsAsking}`)
    return this
  }

  async pushToQueue(payload: {msgId: number; text: string; taskId: number,msgDate:number}) {
    await KvCache.getInstance().put(`${this.keyPrefixIsAsking}`,true)
  }
}
