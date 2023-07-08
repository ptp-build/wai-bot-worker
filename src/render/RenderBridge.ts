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
import WorkerGroup from '../window/woker/WorkerGroup';

export default class RenderBridge {
  static async callApi(botId:string,action:RenderActions,payload:any){
    if(action !== RenderActions.UpdateWorkerStatus){
      console.debug("[callApi]",action,payload)
    }
    if(botId === MasterBotId){
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
        case RenderActions.DeleteChannel:
          return await new RenderChatMsg(payload.chatId).deleteChannel()
        case RenderActions.DeleteMessages:
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
        case RenderActions.GetWorkerAccount:
          return await new WorkerAccount(payload.botId).get()
        case RenderActions.UpdateWorkerStatus:
          return BotWorkerStatus.update(payload)
      }
    }
  }

  static async initWaiApp(){
    const botIds = await WorkerAccount.getBotList()
    const groupIds = await WorkerGroup.getBotList()
    const botAccounts = []
    const botGroups = []
    for (let i = 0; i < botIds.length; i++) {
      botAccounts.push(await new WorkerAccount(botIds[i]).get())
    }
    for (let i = 0; i < groupIds.length; i++) {
      botGroups.push(await new WorkerGroup(groupIds[i]).get())
    }
    const botWorkersStatus = await new BridgeMasterWindow().getWorkersStatus()
    BotWorkerStatus.updateAll(botWorkersStatus)
    return {
      botGroups,
      botAccounts,
      botWorkersStatus
    }
  }
  static async getWorkerStatus(botId:string){
    return new BridgeWorkerWindow(botId).getWorkerStatus({
      chatId:botId
    })
  }
}
