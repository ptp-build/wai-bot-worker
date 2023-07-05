import Bridge from "./Bridge";
import {BotStatusType, BotWorkerStatusType, CallbackButtonAction, RenderActions} from "../types";
import {encodeCallBackButtonPayload} from "../utils/utils";

export default class BridgeRender extends Bridge{
  constructor(botId?:string) {
    super(botId);
  }
  getWorkerStatus(botId:string){
    return this.invokeRenderBridgeAction(RenderActions.GetWorkerStatus,{botId})
  }
  initWaiApp(){
    return this.invokeRenderBridgeAction(RenderActions.InitWaiApp)
  }
  loadBotCommands(botId:string){
    return this.invokeRenderBridgeAction(RenderActions.LoadBotCommands,{botId})
  }
  answerCallbackButton(chatId:string,action:CallbackButtonAction,params?:any,payload?:any){
    return this.invokeRenderBridgeAction(RenderActions.AnswerCallbackButton, {
      chatId: chatId,
      data: encodeCallBackButtonPayload(action, params||{}),
      ...(payload || {})
    })
  }
  updateWorkerStatus(botId:String,statusBot:BotStatusType,statusBotWorker:BotWorkerStatusType){
    return this.invokeRenderBridgeAction(RenderActions.UpdateWorkerStatus,{
      statusBot,statusBotWorker,botId
    })
  }
}
