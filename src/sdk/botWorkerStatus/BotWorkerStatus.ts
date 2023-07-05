import { BotStatusType, BotWorkerStatusType, CallbackButtonAction } from '../types';
import MsgHelper from '../helper/MsgHelper';

export const __StatusBotCenter:Record<string, BotStatusType> = {}
export const __StatusBotWorkerCenter:Record<string, BotWorkerStatusType> = {}

export default class BotWorkerStatus {
  static getIsReadyByBotId(botId:string){
    return __StatusBotWorkerCenter[botId] && __StatusBotWorkerCenter[botId] === BotWorkerStatusType.Ready
  }
  static updateAll(payload:any){
    Object.assign(__StatusBotCenter,payload.statusBot)
    Object.assign(__StatusBotWorkerCenter,payload.statusBotWorker)
  }
  static update(payload:{botId:string,statusBot:BotStatusType,statusBotWorker:BotWorkerStatusType}){
    __StatusBotCenter[payload.botId] = payload.statusBot
    __StatusBotWorkerCenter[payload.botId] = payload.statusBotWorker
    console.log("[BotWorkerStatus]",{__StatusBotCenter,__StatusBotWorkerCenter})
  }
  static get(botId:string){
    return {
      statusBot:__StatusBotCenter[botId],
      statusBotWorker:__StatusBotWorkerCenter[botId]
    }
  }
  static getAllBotWorkersStatus(){
    return {
      statusBot:__StatusBotCenter,
      statusBotWorker:__StatusBotWorkerCenter
    }
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
        inlineButtons = BotWorkerStatus.getBeforeBotReadyReadyButtons(botId,__StatusBotCenter)
        text = `【${__StatusBotCenter[botId]}】`
      }else{
        text= `【${__StatusBotWorkerCenter[botId]}】`
      }
    }
    return {text,inlineButtons,botStatus:__StatusBotCenter[botId],botWorkerStatus:__StatusBotWorkerCenter[botId],}
  }
}
