import { BotStatusType, BotWorkerStatusType, CallbackButtonAction } from '../types';
import MsgHelper from '../masterChat/MsgHelper';
import WindowBotWorkerStatus from '../window/WindowBotWorkerStatus';

export default class RenderBotWorkerStatus extends WindowBotWorkerStatus{

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
}
