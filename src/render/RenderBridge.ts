import RenderCallbackButton from './RenderCallbackButton';
import RenderChatMsgCommand from './RenderChatMsgCommand';
import { RenderActions, SendMessageRequest } from '../sdk/types';
import WorkerAccount from '../window/woker/WorkerAccount';
import RenderChatMsg from './RenderChatMsg';
import RenderChatMsgText from './RenderChatMsgText';
import BridgeMasterWindow from '../sdk/bridge/BridgeMasterWindow';
import BridgeWorkerWindow from '../sdk/bridge/BridgeWorkerWindow';
import { MasterBotId } from '../sdk/setting';
import BotWorkerStatus from '../sdk/botWorkerStatus/BotWorkerStatus';

export default class RenderBridge {
  static async initWaiApp(){
    const botIds = await WorkerAccount.getBotList()
    const botAccounts = []
    for (let i = 0; i < botIds.length; i++) {
      botAccounts.push(await new WorkerAccount(botIds[i]).getWorkersAccount())
    }
    const botWorkersStatus = await new BridgeMasterWindow().getWorkersStatus()
    BotWorkerStatus.updateAll(botWorkersStatus)
    return {
      botAccounts,
      botWorkersStatus
    }
  }
  static async callApi(botId:string,action:RenderActions,payload:any){
    if(
      action !== RenderActions.UpdateWorkerStatus
    ){
      console.debug("[callApi]",action,payload)
    }
    if(botId === MasterBotId){ //master render
      switch (action){
        case RenderActions.InitWaiApp:
          return await RenderBridge.initWaiApp()
        case RenderActions.ApplyMsgId:
          return await new RenderChatMsg(payload.chatId!).applyMsgId()
        case RenderActions.SendBotCommand:
          return await new RenderChatMsgCommand(payload.chatId,payload.localMsgId).processBotCommand(payload.command)
        case RenderActions.SendMessage:
          return await new RenderChatMsgText(payload.chatId,payload.localMsgId).processMessage(payload as SendMessageRequest)
        case RenderActions.UpdateMessage:
            const {localMsgId,chatId,text,entities,msgId} = payload
          return await new RenderChatMsg(chatId,localMsgId).updateMessage({msgId,text,entities})
        case RenderActions.DeleteChat:
          return await new RenderChatMsg(payload.chatId).deleteChat()
        case RenderActions.DeleteChatMessages:
          return await new RenderChatMsg(payload.chatId).deleteChatMessages(payload.ids)
        case RenderActions.SendMultipleQuestion:
          return await new RenderChatMsg(payload.chatId).sendMultipleQuestion()
        case RenderActions.EnableMultipleQuestion:
          return await new RenderChatMsgCommand(payload.chatId).enableMultipleQuestion(payload.command)
        case RenderActions.GetWorkerStatus:
          return await RenderBridge.getWorkerStatus(payload.botId)
        case RenderActions.LoadBotCommands:
          return await new RenderChatMsgCommand(payload.botId).loadBotCommands()
        case RenderActions.AnswerCallbackButton:
          return await new RenderCallbackButton(payload.chatId).process(payload.data,payload.token)
        case RenderActions.GetWorkerAccountProxy:
          return await new WorkerAccount(payload.chatId).getProxy()
        case RenderActions.GetWorkerAccount:
          return await new WorkerAccount(payload.chatId).getWorkersAccount()
        case RenderActions.GetWorkerAccountChatGptAuth:
          return await new WorkerAccount(payload.chatId).getChatGptAuth()
        case RenderActions.UpdateWorkerStatus:
          return BotWorkerStatus.update(payload)
      }
    }
  }
  static async getWorkerStatus(botId:string){
    return new BridgeWorkerWindow(botId).getWorkerStatus({
      chatId:botId
    })
  }
}
