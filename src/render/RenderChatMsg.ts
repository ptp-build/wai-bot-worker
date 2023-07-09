import KvCache from '../worker/services/kv/KvCache';
import {
  ApiChatMsg,
  BotStatusType,
  CallbackButtonAction,
  ChatMsgRenderResponse,
  LocalWorkerAccountType,
  WindowActions,
  WorkerCallbackButtonAction,
} from '../sdk/types';
import { currentTs } from '../sdk/common/time';
import ChatAiMsg from '../window/ChatAiMsg';
import MsgHelper from '../sdk/helper/MsgHelper';
import ChatConfig from '../window/ChatConfig';
import MainChatMsgStorage from '../window/MainChatMsgStorage';
import WorkerAccount from '../window/woker/WorkerAccount';
import BridgeWorkerWindow from '../sdk/bridge/BridgeWorkerWindow';
import BridgeMasterWindow from '../sdk/bridge/BridgeMasterWindow';
import { MasterBotId } from '../sdk/setting';
import WorkerGroup from '../window/woker/WorkerGroup';
import BotWorkerStatus from '../sdk/botWorkerStatus/BotWorkerStatus';
import { ipcRenderer } from 'electron';
import { encodeCallBackButtonPayload } from '../sdk/common/string';

export default class RenderChatMsg {
  public isMasterBot: boolean;
  private chatId: string;
  private localMsgId?: number;
  private botId: string;
  constructor(chatId:string,localMsgId?:number,botId?:string) {
    this.chatId = chatId
    this.localMsgId =localMsgId
    this.botId = botId ? botId : this.chatId
    this.isMasterBot = chatId === MasterBotId
  }
  getIsMasterBot(){
    return this.isMasterBot
  }
  getBotId(){
    return this.botId || this.chatId
  }
  getChatId(){
    return this.chatId
  }
  getLocalMsgId(){
    return this.localMsgId
  }
  async getWorkerAccount():Promise<LocalWorkerAccountType>{
    return await new WorkerAccount(this.getBotId()).get() as LocalWorkerAccountType
  }

  async getGroup():Promise<any>{
    return await new WorkerGroup(this.getChatId()).get() as any
  }
  async applyMsgId(){
    return {
      msgId:this.genMsgId()
    }
  }

  async genMsgId(){
    return await RenderChatMsg.genMessageId()
  }

  static async genMessageId(){
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
        senderId:this.chatId,
        msgId:await this.genMsgId(),
        text,
        chatId:this.chatId,
        inlineButtons
      }
    }
  }

  async invokeAskChatGptMsg(text:string){
    await new BridgeWorkerWindow(this.getBotId()).sendChatMsgToWorker({
        text,
        chatId:this.getChatId(),
      })
    return this
  }

  async askChatGptMessage(text:string){
    await this.invokeAskChatGptMsg(text)
  }

  async handleNewMessage(newMessage:ApiChatMsg,sendToMainChat?:boolean){
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

  async handleUpdateMessage(msg:Partial<ApiChatMsg>){
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
    // const {chatId} = this
    // const enabled = await ChatConfig.isEnableMultipleQuestion(chatId)
    // if(!enabled){
    //   const msgId = await new RenderChatMsg(chatId).genMsgId()
    //   return {
    //     msgId,text:"Sorry,please send /multipleQuestions enable multiple questioning first"
    //   }
    // }else{
    //   const msgIds = []
    //   const msgList = await new ChatAiMsg(chatId).getAskList()
    //   console.log({msgList})
    //   let text = ""
    //   for (let i = 0; i < msgList.length; i++) {
    //     const id = msgList[i]
    //     msgIds.push(id)
    //     const m = await new MainChatMsgStorage().getRow(chatId,id)
    //     if(m){
    //       text += m.text+"\n"
    //     }
    //   }
    //   console.log({msgIds})
    //   if(msgIds.length > 0){
    //     const aiMsgId = await new RenderChatMsg(chatId).askChatGptMessage(text);
    //     for (let i = 0; i < msgList.length; i++) {
    //       await new ChatAiMsg(chatId).save(msgList[i],aiMsgId)
    //     }
    //     return {
    //       msgIds
    //     }
    //   }else{
    //     const msgId = await new RenderChatMsg(chatId).genMsgId()
    //     return {
    //       msgId,text:"Please type message"
    //     }
    //   }
    // }
  }
  async deleteChat(){
    await WorkerAccount.deleteBotList(this.getChatId())
  }
  async deleteChannel(){
    await WorkerGroup.deleteBotList(this.getChatId())
  }
  async deleteChatMessages(ids:number[]){
    await new BridgeMasterWindow(this.chatId).deleteMessages({ids,chatId:this.chatId})
    await new ChatAiMsg(this.chatId).deleteAskList(ids)
  }

  waitForBotStatus(botId:string,status:BotStatusType, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkStatus = () => {
        const {statusBot} = BotWorkerStatus.get(botId)
        if(statusBot === status){
          resolve(status);
        }else{
          const elapsedTime = Date.now() - startTime;
          if(elapsedTime  >= timeout){
            reject(new Error(`Timeout exceeded (${timeout}ms) while waiting for status: ${status}`));
          }else{
            setTimeout(checkStatus, 500);
          }
        }
      };
      checkStatus();
    });
  }
  async checkWorkerIsOffline(botId:string):Promise<ChatMsgRenderResponse|undefined>{
    let {statusBot} = BotWorkerStatus.get(botId)
    if(!statusBot){
      statusBot = BotStatusType.OFFLINE
    }
    switch (statusBot){
      case BotStatusType.ONLINE:
        break
      case BotStatusType.OFFLINE:
        try{
          await ipcRenderer.invoke(WindowActions.MasterWindowCallbackAction,encodeCallBackButtonPayload(CallbackButtonAction.Master_OpenWorkerWindow,{
            botId
          }))
          await this.waitForBotStatus(botId,BotStatusType.ONLINE)
        }catch (e){
          console.error("[sendMessageToWorker] error",e)
          return {
            msgId:await this.genMsgId(),sendingState:"messageSendingStateFailed",
            inlineButtons:[
              [MsgHelper.buildCallBackAction("ReSend",CallbackButtonAction.Local_resend)],
              [MsgHelper.buildCallBackAction("Restart Window",CallbackButtonAction.Master_restartWorker,{botId})],
            ]
          }
        }
        break
      default:
        return {
          msgId:await this.genMsgId(),sendingState:"messageSendingStateFailed",
          inlineButtons:[
            [MsgHelper.buildUnsupportedAction(`Worker is ${statusBot}!`)],
            [MsgHelper.buildCallBackAction("ReSend",CallbackButtonAction.Local_resend)],
            [MsgHelper.buildCallBackAction("Reload Window",WorkerCallbackButtonAction.Worker_locationReload,{botId})],
          ]}
    }
    return undefined
  }
}
