import {ipcMain} from 'electron';
import {
  BotStatusType,
  BotWorkerStatusType,
  MasterEventActions,
  WindowActions, WorkerCallbackButtonAction,
  WorkerEventActions,
  WorkerEvents
} from "../../types";
import MainWindowManager from "../../ui/MainWindowManager";
import MasterWindowCallbackAction from "./MasterWindowCallbackAction";
import WindowDbAction from "./WindowDbAction";
import {parseCallBackButtonPayload} from "../../utils/utils";
import WindowEventsHandler from "./WindowEventsHandler";

export default class WindowActionsHandler {
  handleAction(){
    ipcMain.handle(WindowActions.WorkerWindowCallbackAction, async (_,data:string) => {
      const {path,params} = parseCallBackButtonPayload(data)
      console.log("[WorkerWindowCallbackAction]",{path,params} )
      const {chatId} = params
      if(chatId !== "1"){
        if(MainWindowManager.getInstance(chatId)){
          MainWindowManager.getInstance(chatId)?.getMainWindow()
            .webContents.send(
              WorkerEvents.Worker_Chat_Msg,chatId,WorkerEventActions.Worker_CallBackButton,{path,...params})
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
        case WorkerEventActions.Worker_Reload:
          MainWindowManager.getInstance(botId).reload()
          break;
        case WorkerEventActions.Worker_LoadUrl:
          await MainWindowManager.getInstance(botId).loadUrl(payload.url)
          return
        case WorkerEventActions.Worker_ActiveWindow:
          MainWindowManager.getInstance(payload.chatId).moveTop()
          return
      }
      if(MainWindowManager.getInstance(botId) && MainWindowManager.getInstance(botId).getMainWindowWebContents()){
        MainWindowManager.getInstance(botId).getMainWindowWebContents()!.send(WorkerEvents.Worker_Chat_Msg,botId,action,payload)
      }else{
        if(action === WorkerEventActions.Worker_GetWorkerStatus){
          await WindowEventsHandler.sendEventToMasterChat(MasterEventActions.UpdateWorkerStatus, {
            statusBot: BotStatusType.OFFLINE,
            statusBotWorker: BotWorkerStatusType.WaitToReady,
            botId
          })
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
      void await WindowEventsHandler.sendEventToMasterChat(action,payload)
    })
  }
}
