import KvCache from '../worker/services/kv/KvCache';
import {
  BotWorkerStatusType,
  CallbackButtonAction,
  LocalWorkerAccountType,
  NewMessage,
  WindowActions,
  WorkerCallbackButtonAction,
} from '../types';
import { currentTs } from '../utils/time';
import { ipcRenderer } from 'electron';
import ChatAiMsg from '../window/ChatAiMsg';
import MsgHelper from '../masterChat/MsgHelper';
import ChatConfig from '../window/ChatConfig';
import MainChatMsgStorage from '../window/MainChatMsgStorage';
import WorkerAccount from '../window/woker/WorkerAccount';
import RenderBotWorkerStatus from './RenderBotWorkerStatus';
import { encodeCallBackButtonPayload } from '../utils/utils';
import { MasterBotId } from '../setting';
import BridgeWorkerWindow from '../bridge/BridgeWorkerWindow';
import BridgeMasterWindow from '../bridge/BridgeMasterWindow';
import RenderBridge from './RenderBridge';

export default class RenderChatMsg {
  public isMasterBot: boolean;
  private chatId: string;
  private localMsgId?: number;
  constructor(chatId:string,localMsgId?:number) {
    this.chatId = chatId
    this.localMsgId =localMsgId
    this.isMasterBot = chatId === MasterBotId
  }
  getIsMasterBot(){
    return this.isMasterBot
  }
  getChatId(){
    return this.chatId
  }
  getLocalMsgId(){
    return this.localMsgId
  }
  async getWorkerAccount():Promise<LocalWorkerAccountType>{
    return await new WorkerAccount(this.getChatId()).getWorkersAccount() as LocalWorkerAccountType
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
    await new BridgeWorkerWindow(botId).sendChatMsgToWorker({
        text,
        updateMessage:msg,
        fromBotId:this.getChatId(),
        taskId
      })
    return this
  }

  async askChatGptMessage(text:string,taskId?:number,msgId?:number){
    if(!msgId){
      msgId = await this.genMsgId()
    }

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

  async handleNewMessage(newMessage:NewMessage,sendToMainChat?:boolean){
    await new BridgeMasterWindow(this.getChatId()).newMessage({
        sendToMainChat,
        newMessage
      })
  }


  async replyNewMessage(text:string, inlineButtons?: object[][],isOutgoing?:boolean,sendToMainChat?:boolean){
    const newMessage = {
      msgId:await this.genMsgId(),
      text,
      isOutgoing:isOutgoing === undefined ? false : isOutgoing,
      chatId:this.chatId,
      inlineButtons
    }
    await this.handleNewMessage(newMessage,sendToMainChat)
    return newMessage.msgId
  }

  async handleUpdateMessage(msg:Partial<NewMessage>){
    await new BridgeMasterWindow(this.getChatId()).updateMessage({
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
    await new BridgeMasterWindow(this.chatId).deleteMessages({ids,chatId:this.chatId})
    await new ChatAiMsg(this.chatId).deleteAskList(ids)
  }
}
