import KvCache from "../worker/services/kv/KvCache";
import {UserIdFirstBot} from "../setting";
import {
  BotWorkerStatusType,
  CallbackButtonAction,
  MasterEventActions,
  NewMessage,
  WindowActions,
  WorkerEventActions
} from "../types";
import {currentTs} from "../utils/utils";
import {ipcRenderer} from "electron";
import ChatAiMsg from "../window/ChatAiMsg";
import MsgHelper from "../masterChat/MsgHelper";
import ChatConfig from "../window/ChatConfig";
import MainChatMsgStorage from "../window/MainChatMsgStorage";
import WorkerAccount from "../window/woker/WorkerAccount";
import RenderBotWorkerStatus from "./RenderBotWorkerStatus";

export default class RenderChatMsg {
  private isMasterBot: boolean;
  private chatId: string;
  private localMsgId?: number;
  private msgId?:number;
  private chatAiMsg: ChatAiMsg;
  constructor(chatId:string,localMsgId?:number) {
    this.chatId = chatId
    this.localMsgId =localMsgId
    this.isMasterBot = chatId === UserIdFirstBot
    this.chatAiMsg = new ChatAiMsg(chatId)
  }
  getChatId(){
    return this.chatId
  }
  getLocalMsgId(){
    return this.localMsgId
  }
  async getWorkerAccount(){
    return await new WorkerAccount(this.getChatId()).getWorkersAccount()
  }
  async applyMsgId(){
    return {
      msgId:this.genMsgId()
    }
  }

  async genMsgId(){
    const msgIdStr = await KvCache.getInstance().get(`MsgIncrId`)
    let msgId = msgIdStr ? parseInt(msgIdStr) : 0
    msgId = msgId + 1
    await KvCache.getInstance().put(`MsgIncrId`,msgId.toString())
    return msgId
  }

  async replyAck(){
    return {
      localMsgId:this.localMsgId,
      msgId:this.localMsgId ? await this.genMsgId() : undefined,
    }
  }

  async replyText(text:string, inlineButtons?: object[][]){
    return {
      localMsgId:this.localMsgId,
      msgId:this.localMsgId ? await this.genMsgId() : undefined,
      newMessage:{
        msgId:await this.genMsgId(),
        text,
        chatId:this.chatId,
        inlineButtons
      }
    }
  }

  async invokeAskChatGptMsg(text:string,msg:NewMessage,taskId?:number){
    let botId = this.getChatId()
    const workerAccount = await new WorkerAccount(botId).getWorkersAccount()
    if(workerAccount && workerAccount.type !== "chatGpt"){
      const readyBots = []
      const workerIds = await WorkerAccount.getBotList()
      for (let i = 0; i < workerIds.length; i++) {
        const worker_botId = workerIds[i]
        const workerAccount = await new WorkerAccount(worker_botId).getWorkersAccount()
        if(workerAccount && workerAccount.type === "chatGpt"){
          const {statusBotWorker} = RenderBotWorkerStatus.get(workerAccount.botId)
          if(statusBotWorker === BotWorkerStatusType.Ready){
            readyBots.push(workerAccount.botId)
          }
        }
      }
      console.log("[readyBots]",readyBots)
      if(readyBots.length > 0){
        botId = readyBots[Math.floor(Math.random() * readyBots.length)];
      }else{
        setTimeout(async ()=>await this.invokeAskChatGptMsg(text,msg,taskId),1000)
      }
    }

    await ipcRenderer.invoke(
      WindowActions.WorkerWindowAction,
      botId,
      WorkerEventActions.Worker_AskMsg,
      {
        text:text,
        updateMessage:msg,
        fromBotId:this.getChatId(),
        taskId
      })
    return this
  }

  async askChatGptMessage(text:string,taskId?:number){
    const msgId = await this.genMsgId()
    const msg = {
      chatId:this.getChatId(),
      msgId,
      text:"...",
      entities:[],
      inlineButtons:[],
      isOutgoing:false,
      senderId:this.getChatId(),
      msgDate:currentTs(),
    }
    await this.handleNewMessage(msg)
    console.log("askChatGptMessage",text)
    await this.invokeAskChatGptMsg(text,msg,taskId)
    return msgId
  }

  async handleNewMessage(newMessage:NewMessage){
    await ipcRenderer.invoke(
      WindowActions.MasterWindowAction,
      this.getChatId(),
      MasterEventActions.NewMessage,
      {
        newMessage
      })
  }

  async handleUpdateMessage(msg:Partial<NewMessage>){
    await ipcRenderer.invoke(
      WindowActions.MasterWindowAction,
      this.getChatId(),
      MasterEventActions.UpdateMessage,
      {
        updateMessage:msg
      })
  }

  async updateMessage({msgId,text,entities}:{msgId:number,text:string,entities?:any[]}){
    const aiMsgId = await new ChatAiMsg(this.getChatId()).get(msgId)
    const msgListTmp = await new ChatAiMsg(this.getChatId()).getAskList();
    let inlineButtons:any[] = []
    if(aiMsgId && !msgListTmp.includes(msgId)){
      inlineButtons = [
        [
          MsgHelper.buildCallBackAction("Resend",CallbackButtonAction.Render_resendAiMsg)
        ],
        [
          MsgHelper.buildCallBackAction("Cancel",CallbackButtonAction.Local_cancelInlineButtons)
        ]
      ]
    }
    console.debug(msgId,{aiMsgId},msgListTmp,inlineButtons)

    await this.handleUpdateMessage({
      msgId,text,entities,chatId:this.getChatId(),inlineButtons
    })
  }
  async processMessage({text,entities,taskId}:{text:string,entities?:any[],taskId?:number}){
    const msgId = await this.genMsgId()
    const newMessage = {
      chatId:this.getChatId(),
      msgId,
      text,
      entities:entities||[],
      inlineButtons:[],
      isOutgoing:true,
      senderId:"1",
      msgDate:currentTs(),
    }
    await this.handleNewMessage(newMessage)

    const workerAccount = await new WorkerAccount(this.getChatId()).getWorkersAccount()

    if((workerAccount && workerAccount.type !== "chatGpt")){
      if(!taskId){
        return {msgId,sendingState:undefined}
      }
    }

    const enableMultipleQuestion = await ChatConfig.isEnableMultipleQuestion(this.getChatId())
    if(enableMultipleQuestion){
      await this.chatAiMsg.addAskList(newMessage.msgId)
      return {msgId,sendingState:"messageSendingStatePending"}
    }else{
      const aiMsgId = await this.askChatGptMessage(text,taskId)
      await new ChatAiMsg(this.getChatId()).save(msgId,aiMsgId)
      return {aiMsgId,msgId,sendingState:undefined}
    }
  }

  async sendMultipleQuestion(){
    const {chatId} = this
    const enabled = await ChatConfig.isEnableMultipleQuestion(chatId)
    if(!enabled){
      const msgId = await new RenderChatMsg(chatId).genMsgId()
      return {
        msgId,text:"Sorry,please send /multipleQuestions enable multiple questioning first"
      }
    }else{
      const msgIds = []
      const msgList = await new ChatAiMsg(chatId).getAskList()
      console.log({msgList})
      let text = ""
      for (let i = 0; i < msgList.length; i++) {
        const id = msgList[i]
        msgIds.push(id)
        const m = await new MainChatMsgStorage().getRow(chatId,id)
        if(m){
          text += m.text+"\n"
        }
      }
      console.log({msgIds})
      if(msgIds.length > 0){
        const aiMsgId = await new RenderChatMsg(chatId).askChatGptMessage(text);
        for (let i = 0; i < msgList.length; i++) {
          await new ChatAiMsg(chatId).save(msgList[i],aiMsgId)
        }
        return {
          msgIds
        }
      }else{
        const msgId = await new RenderChatMsg(chatId).genMsgId()
        return {
          msgId,text:"Please type message"
        }
      }
    }
  }
  async deleteChat(){
    await WorkerAccount.deleteBotList(this.getChatId())
  }
  async deleteChatMessages(ids:number[]){
    await ipcRenderer.invoke(
      WindowActions.MasterWindowAction,
      this.chatId,
      MasterEventActions.DeleteMessages,
      {ids,chatId:this.chatId}
      )
    await new ChatAiMsg(this.chatId).deleteAskList(ids)
  }

  async resendAiMsg(msgId:number){
    const {chatId} =this
    const chatAiMsg = new ChatAiMsg(chatId)
    const mainChatMsgStorage = new MainChatMsgStorage()
    const aiMsgId = await chatAiMsg.get(msgId);
    const msgListTmp = await chatAiMsg.getAskList();
    console.debug("resendAiMsg",{msgId,aiMsgId,msgListTmp})
    if(aiMsgId && !msgListTmp.includes(msgId)){
      const msg = await mainChatMsgStorage.getRow(chatId,msgId)
      const aiMsg = await mainChatMsgStorage.getRow(chatId,aiMsgId)
      if(aiMsg && msg && msg.text){
        let text = "";
        const enableMultipleQuestion = await ChatConfig.isEnableMultipleQuestion(chatId)
        if(enableMultipleQuestion){
          const preAiMsgList = await chatAiMsg.getAskListFinished(aiMsg.msgId)
          if(preAiMsgList.length > 0){
            for (let i = 0; i < preAiMsgList.length; i++) {
              const aiMsg1 = await mainChatMsgStorage.getRow(chatId,preAiMsgList[i])
              if(aiMsg1 && aiMsg1.text){
                text += aiMsg1.text + "\n"
              }
            }
            text = text.trim()
          }
        }else{
          const aiMsg1 = await mainChatMsgStorage.getRow(chatId,msgId)
          if(aiMsg1 && aiMsg1.text){
            text += aiMsg1.text
          }
        }
        if(text){
          await this.invokeAskChatGptMsg(text,aiMsg)
          await this.handleUpdateMessage({
            ...aiMsg,
            text:"..."
          })
          await this.handleUpdateMessage({
            ...msg,
            inlineButtons:[]
          })
        }
      }
    }
  }
}
