import {BotStatusType, BotWorkerStatusType, CallbackButtonAction, WorkerCallbackButtonAction} from "../types";
import MsgHelper from "../masterChat/MsgHelper";

export const __StatusBotCenter:Record<string, BotStatusType> = {}
export const __StatusBotWorkerCenter:Record<string, BotWorkerStatusType> = {}

export default class RenderBotWorkerStatus {
  static update(botId:string,statusBot:BotStatusType,statusBotWorker:BotWorkerStatusType){
    __StatusBotCenter[botId] = statusBot
    __StatusBotWorkerCenter[botId] = statusBotWorker
  }
  static getBeforeBotReadyReadyButtons(botId:string,__StatusBotCenter:Record<string, BotStatusType>){
    let inlineButtons:any = []
    const status = __StatusBotCenter[botId]
    switch (status){
      case BotStatusType.LoginButtonClickNeed:
      case BotStatusType.LoginInputUsernameNeed:
      case BotStatusType.LoginInputPasswordNeed:
      case BotStatusType.RegenerateResponseNeed:
      case BotStatusType.TaskWorkerNoApi:
      case BotStatusType.TaskWorkerApiError:
        inlineButtons = [
          [MsgHelper.buildCallBackAction("➡️ Handle "+status,`Worker_${status}`)]
        ]
        break
    }
    return [
      ...inlineButtons
    ]
  }
  static getStatusMessage(botId:string,__StatusBotCenter:Record<string, BotStatusType>,__StatusBotWorkerCenter:Record<string, BotWorkerStatusType>){
    let text = ""
    let inlineButtons = []
    if(!__StatusBotWorkerCenter || __StatusBotWorkerCenter[botId] === undefined){
      text = "【Offline】"
      inlineButtons = [
        [MsgHelper.buildCallBackAction("Open Window",CallbackButtonAction.Master_createChatGptBotWorker) ]
      ]
    }else{
      if(__StatusBotCenter[botId] !== BotStatusType.ONLINE){
        inlineButtons = RenderBotWorkerStatus.getBeforeBotReadyReadyButtons(botId,__StatusBotCenter)
        text = `【${__StatusBotCenter[botId]}】`
      }else{
        text= `【${__StatusBotWorkerCenter[botId]}】`
      }
    }
    return {text,inlineButtons,botStatus:__StatusBotCenter[botId],botWorkerStatus:__StatusBotWorkerCenter[botId],}
  }
  static get(botId:string){
    return {
      statusBot:__StatusBotCenter[botId],
      statusBotWorker:__StatusBotWorkerCenter[botId]
    }
  }

  static getStatusBotCenter(){
    return __StatusBotCenter
  }
}
