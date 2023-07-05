import { ipcMain } from 'electron';
import {
  MasterEventActions,
  WindowActions,
  WorkerCallbackButtonAction,
  WorkerEventActions,
  WorkerEvents,
} from '../../sdk/types';
import MainWindowManager from '../../ui/MainWindowManager';
import MasterWindowCallbackAction from './MasterWindowCallbackAction';
import WindowDbAction from './WindowDbAction';
import WindowEventsHandler from './WindowEventsHandler';
import WorkerStatus from './WorkerStatus';
import MsgHelper from '../../sdk/helper/MsgHelper';
import WorkerAccount from '../woker/WorkerAccount';
import MasterActions from './MasterActions';
import { parseCallBackButtonPayload } from '../../sdk/common/string';
import { MasterBotId } from '../../sdk/setting';
import BotWorkerStatus from '../../sdk/botWorkerStatus/BotWorkerStatus';

export default class WindowActionsHandler {
  handleAction(){
    ipcMain.handle(WindowActions.WorkerWindowCallbackAction, async (_,data:string) => {
      const {path,params} = parseCallBackButtonPayload(data)
      console.log("[WorkerWindowCallbackAction]",{path,params} )
      const {chatId} = params
      if(chatId !== MasterBotId){
        if(
          MainWindowManager.getInstance(chatId) && MainWindowManager.getInstance(chatId)?.getMainWindow()
        ){
          MainWindowManager.getInstance(chatId)?.getMainWindow()
            .webContents.send(
              WorkerEvents.Worker_Chat_Msg,chatId,WorkerEventActions.Worker_CallBackButton,{path,...params})
        }else{
          await WindowEventsHandler.replyChatMsg("Worker is Offline,Pls send /openWindow first!",chatId,[
            MsgHelper.buildLocalCancel()
          ])
        }
      }
    });

    ipcMain.handle(WindowActions.MasterWindowCallbackAction, async (_,data:string) => {
      console.log("[MasterWindowCallbackAction]",data)
      await new MasterWindowCallbackAction().callbackButtonAction(data)
    });

    ipcMain.handle(WindowActions.WindowDbAction, async (_,actionData:any) => {
      await new WindowDbAction().process(actionData)
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
      if(action !== WorkerEventActions.Worker_NotifyWorkerStatus){
        console.log("[WorkerWindowAction]",botId,action,payload)
      }
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
        case WorkerEventActions.Worker_ActiveWindow:
          MainWindowManager.getInstance(payload.botId).moveTop()
          return
      }
      if(MainWindowManager.getInstance(botId) && MainWindowManager.getInstance(botId).getMainWindowWebContents()){
        MainWindowManager.getInstance(botId).getMainWindowWebContents()!.send(WorkerEvents.Worker_Chat_Msg,botId,action,payload)
      }else{
        if(action === WorkerEventActions.Worker_GetWorkerStatus){
          await new WorkerStatus(botId).sendOffline()
        }
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
        case MasterEventActions.GetWorkersAccount:
          return new WorkerAccount(payload.botId).getWorkersAccount();
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
