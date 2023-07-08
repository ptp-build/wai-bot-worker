import { ipcMain } from 'electron';
import {
  MasterEventActions, MasterEvents,
  WindowActions,
  WorkerCallbackButtonAction,
  WorkerEventActions,
  WorkerEvents,
} from '../../sdk/types';
import MainWindowManager from '../../ui/MainWindowManager';
import MasterWindowCallbackAction from './MasterWindowCallbackAction';
import WindowEventsHandler from './WindowEventsHandler';
import WorkerStatus from './WorkerStatus';
import MsgHelper from '../../sdk/helper/MsgHelper';
import WorkerAccount from '../woker/WorkerAccount';
import MasterActions from './MasterActions';
import { parseCallBackButtonPayload } from '../../sdk/common/string';
import { MasterBotId } from '../../sdk/setting';
import BotWorkerStatus from '../../sdk/botWorkerStatus/BotWorkerStatus';
import { getMasterWindowWebContent } from '../../ui/window';

export default class WindowActionsHandler {
  handleAction(){
    ipcMain.handle(WindowActions.WorkerWindowCallbackAction, async (_,data:string) => {
      const {path,params} = parseCallBackButtonPayload(data)
      const {chatId} = params
      const botId = chatId
      if(botId !== MasterBotId){
        const account = await new WorkerAccount(botId).get()
        console.debug("[WorkerWindowCallbackAction]",botId,account.type)
        if(account.type !== "bot"){
          const worker = MainWindowManager.getMainWindowWebContents(chatId)
          if(worker){
            worker.send(
              WorkerEvents.Worker_Chat_Msg,
              chatId,
              WorkerEventActions.Worker_CallBackButton,
              {path,...params}
            )
          }else{
            await WindowEventsHandler.replyChatMsg("Worker is Offline,Pls send /openWindow first!",chatId,[
              MsgHelper.buildLocalCancel()
            ])
          }
        }else{
          getMasterWindowWebContent()!.send(
            WorkerEvents.Worker_Chat_Msg,
            botId,
            WorkerEventActions.Worker_CallBackButton,
            {path,...params}
          );
        }
      }
    });

    ipcMain.handle(WindowActions.MasterWindowCallbackAction, async (_,data:string) => {
      console.log("[MasterWindowCallbackAction]",data)
      await new MasterWindowCallbackAction().callbackButtonAction(data)
    });

    ipcMain.handle(WindowActions.WorkerWindowKeyboardAction,
      async (_,botId,type,keyCode)=>{
        console.log("[WorkerWindowKeyboardAction]",botId,keyCode,type)
        MainWindowManager.getInstance(botId).sendInputKeyboardEvent(type,keyCode)
      })

    ipcMain.handle(WindowActions.WorkerWindowMouseAction,
      async (_,botId,payload)=>{
        console.log("[WorkerWindowMouseAction]",botId,payload)
        MainWindowManager.getInstance(botId).sendMouseEvent(payload)
      })

    ipcMain.handle(WindowActions.WorkerWindowAction,async (_,botId:string,action:WorkerEventActions|WorkerCallbackButtonAction,payload:any)=>{
      switch (action){
        case WorkerEventActions.Worker_ShowDevTools:
          MainWindowManager.getInstance(botId).showDevTools()
          return;
        case WorkerEventActions.Worker_Reload:
          MainWindowManager.getInstance(botId).reload()
          break;
        case WorkerEventActions.Worker_GoBack:
          MainWindowManager.getInstance(botId).goBack()
          break;
        case WorkerEventActions.Worker_LoadUrl:
          await MainWindowManager.getInstance(botId).loadUrl(payload.url)
          return
        case WorkerEventActions.Worker_OnOpenChat:
          await MainWindowManager.getInstance(payload.botId).openChatBot()
          return
        case WorkerEventActions.Worker_ActiveWindow:
          MainWindowManager.getInstance(payload.botId).activeWindow()
          return
      }
      const account = await new WorkerAccount(botId).get()
      if(account.type !== "bot"){
        const worker = MainWindowManager.getMainWindowWebContents(botId)
        if(worker){
          worker.send(WorkerEvents.Worker_Chat_Msg,botId,action,payload)
        }else{
          if(action === WorkerEventActions.Worker_GetWorkerStatus){
            await new WorkerStatus(botId).sendOffline()
          }
        }
      }else{
        getMasterWindowWebContent()!.send(WorkerEvents.Worker_Chat_Msg,botId, action, payload);
      }
    })

    ipcMain.handle(WindowActions.MasterWindowAction,async (_,botId:string,action:MasterEventActions,payload:any)=>{
      if (
        action !== MasterEventActions.UpdateWorkerStatus &&
        action !== MasterEventActions.GetWorkersStatus
      ){
        console.log("[MasterWindowAction]",botId,action,payload)
      }
      switch (action) {
        case MasterEventActions.UpdateWorkerStatus:
          BotWorkerStatus.update(payload);
          break
        case MasterEventActions.GetWorkerAccount:
          return new WorkerAccount(payload.botId).get();
        case MasterEventActions.GetWorkerAccounts:
          return WorkerAccount.getAccounts();
        case MasterEventActions.GetWorkersStatus:
          return BotWorkerStatus.getAllBotWorkersStatus();
        case MasterEventActions.RestartWorkerWindow:
          return MasterActions.restartWorkerWindow(payload.botId)
        case MasterEventActions.GetFileData:
          return await MasterActions.getFileDate(payload)
        case MasterEventActions.SaveFileData:
          await MasterActions.saveFileDate(payload)
          return
      }
      return  await WindowEventsHandler.sendEventToMasterChat(action,payload)
    })
  }

}
