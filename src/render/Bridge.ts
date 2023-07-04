import RenderCallbackButton from "./RenderCallbackButton";
import RenderChatMsgCommand from "./RenderChatMsgCommand";
import { MasterEventActions, RenderActions, SendMessageRequest, WindowActions, WorkerEventActions } from '../types';
import WorkerAccount from "../window/woker/WorkerAccount";
import RenderBotWorkerStatus from "./RenderBotWorkerStatus";
import RenderChatMsg from "./RenderChatMsg";
import {ipcRenderer} from "electron";
import RenderChatMsgText from './RenderChatMsgText';

export default class Bridge {
  static async initWaiApp(){
    const botIds = await WorkerAccount.getBotList()
    const botAccounts = []
    for (let i = 0; i < botIds.length; i++) {
      botAccounts.push(await new WorkerAccount(botIds[i]).getWorkersAccount())
    }
    const botWorkersStatus = await ipcRenderer.invoke(
      WindowActions.MasterWindowAction,
      "1",
      MasterEventActions.GetWorkersStatus,
      {}
    )
    RenderBotWorkerStatus.updateAll(botWorkersStatus)
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
    if(parseInt(botId) === 1){ //master render
      switch (action){
        case RenderActions.InitWaiApp:
          return await Bridge.initWaiApp()
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
          return await Bridge.getWorkerStatus(payload.chatId!)
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
          return RenderBotWorkerStatus.update(payload)
      }
    }
  }
  static async getWorkerStatus(botId:string){
    return Bridge.sendEventActionToWorker(botId,WorkerEventActions.Worker_GetWorkerStatus,{
      chatId:botId
    })
  }

  static invokeMasterWindow(botId:string,action:MasterEventActions,payload:any){
    return ipcRenderer.invoke(
      WindowActions.MasterWindowAction,
      botId,
      action,
      payload
    )
  }

  static async sendChatMsgToWorker(botId:string,payload:any){
    return await ipcRenderer.invoke(
      WindowActions.WorkerWindowAction,
      botId,
      WorkerEventActions.Worker_AskMsg,
      payload
    )
  }
  static async sendEventActionToWorker(botId:string,action:WorkerEventActions,payload:any){
    return await ipcRenderer.invoke(
      WindowActions.WorkerWindowAction,
      botId,
      action,
      payload
    )
  }
}
