import Bridge from "./Bridge";
import {
  BotStatusType,
  CallbackButtonActionType,
  RenderActions,
} from '../types';
import { encodeCallBackButtonPayload } from '../common/string';

export default class BridgeRender extends Bridge{
  constructor(botId?:string) {
    super(botId);
  }
  deleteChannel(payload:any){
    return this.invokeRenderBridgeAction(RenderActions.DeleteChannel,payload)
  }
  deleteChat(payload:any){
    return this.invokeRenderBridgeAction(RenderActions.DeleteChat,payload)
  }
  serverLoop(payload:any){
    return this.invokeRenderBridgeAction(RenderActions.ServerLoop,payload)
  }
  sendMessage(payload:any){
    return this.invokeRenderBridgeAction(RenderActions.SendMessage,payload)
  }
  updateMessage(payload:any){
    return this.invokeRenderBridgeAction(RenderActions.UpdateMessage,payload)
  }
  sendBotCommand(payload:any){
    return this.invokeRenderBridgeAction(RenderActions.SendBotCommand,payload)
  }
  sendMultipleQuestion(payload:any){
    return this.invokeRenderBridgeAction(RenderActions.SendMultipleQuestion,payload)
  }
  enableMultipleQuestion(payload:any){
    return this.invokeRenderBridgeAction(RenderActions.EnableMultipleQuestion,payload)
  }
  applyMsgId(chatId:string){
    return this.invokeRenderBridgeAction(RenderActions.ApplyMsgId,{chatId})
  }
  deleteMessages(payload:any){
    return this.invokeRenderBridgeAction(RenderActions.DeleteMessages,payload)
  }
  getWorkerStatus(botId:string){
    return this.invokeRenderBridgeAction(RenderActions.GetWorkerStatus,{botId})
  }

  getWorkerAccount(botId:string){
    return this.invokeRenderBridgeAction(RenderActions.GetWorkerAccount,{botId})
  }
  initWaiApp(){
    return this.invokeRenderBridgeAction(RenderActions.InitWaiApp)
  }
  loadBotCommands(botId:string){
    return this.invokeRenderBridgeAction(RenderActions.LoadBotCommands,{botId})
  }
  answerCallbackButton(chatId:string,action:CallbackButtonActionType,params?:any,payload?:any){
    return this.invokeRenderBridgeAction(RenderActions.AnswerCallbackButton, {
      chatId: chatId,
      data: encodeCallBackButtonPayload(action, {
        ...(params||{}),
        ...(payload||{})
      }),
    })
  }
  updateWorkerStatus(botId:String,statusBot:BotStatusType){
    return this.invokeRenderBridgeAction(RenderActions.UpdateWorkerStatus,{
      statusBot,botId
    })
  }
}
