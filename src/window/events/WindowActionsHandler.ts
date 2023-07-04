import { ipcMain } from 'electron';
import {
  GetFileDataType,
  MasterEventActions,
  SaveFileDataType,
  WindowActions,
  WorkerCallbackButtonAction,
  WorkerEventActions,
  WorkerEvents,
} from '../../types';
import MainWindowManager from '../../ui/MainWindowManager';
import MasterWindowCallbackAction from './MasterWindowCallbackAction';
import WindowDbAction from './WindowDbAction';
import { parseCallBackButtonPayload, sleep } from '../../utils/utils';
import WindowEventsHandler from './WindowEventsHandler';
import BigStorage from '../../worker/services/storage/BigStorage';
import WorkerStatus from './WorkerStatus';
import MsgHelper from '../../masterChat/MsgHelper';
import WindowBotWorkerStatus from '../WindowBotWorkerStatus';
import WorkerAccount from '../woker/WorkerAccount';

export default class WindowActionsHandler {
  handleAction(){
    ipcMain.handle(WindowActions.WorkerWindowCallbackAction, async (_,data:string) => {
      const {path,params} = parseCallBackButtonPayload(data)
      console.log("[WorkerWindowCallbackAction]",{path,params} )
      const {chatId} = params
      if(chatId !== "1"){
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
          MainWindowManager.getInstance(payload.chatId).moveTop()
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
          WindowBotWorkerStatus.update(payload);
          break
        case MasterEventActions.GetWorkersAccount:
          return new WorkerAccount(payload.botId).getWorkersAccount();
        case MasterEventActions.GetWorkersStatus:
          return WindowBotWorkerStatus.getAllBotWorkersStatus();
        case MasterEventActions.RestartWorkerWindow:
          return WindowActionsHandler.restartWorkerWindow(payload.botId)
        case MasterEventActions.GetFileData:
          return await WindowActionsHandler.getFileDate(payload)
        case MasterEventActions.SaveFileData:
          await WindowActionsHandler.saveFileDate(payload)
          return
      }
      return  await WindowEventsHandler.sendEventToMasterChat(action,payload)
    })
  }
  static async saveFileDate({filePath,type,content}:SaveFileDataType){
    filePath = filePath.replace(/_/g,"/")
    console.log("[saveFileDate]",{filePath})
    switch (type){
      case "hex":
        await BigStorage.getInstance().put(filePath,Buffer.from(content,"hex"))
        break
      case "base64":
        await BigStorage.getInstance().put(filePath,Buffer.from(content,"base64"))
        break
      case "string":
        await BigStorage.getInstance().put(filePath,content)
        break
    }
  }

  static async getFileDate({filePath,type}:GetFileDataType){
    if(
      filePath.startsWith("photo")
      && filePath.indexOf("?size=") > -1
      && filePath.indexOf("_") > -1
    ){
      //photo1_GM_DL4_XIxKH0LBjhA?size=c
      filePath = filePath.split("?")[1].replace("photo","").replace(/_/g,"/")
    }
    if(
      (filePath.startsWith("avatar") || filePath.startsWith("profile"))
      && filePath.indexOf("?") > -1
      && filePath.indexOf("_") > -1
    ){
      //avatar20006?1_GM_DL4_XIxKH0LBjhA
      filePath = filePath.split("?")[1].replace(/_/g,"/")
    }
    if(
      filePath.startsWith("msg")
      && filePath.indexOf("-") > -1
      && filePath.indexOf(":") > -1
      && filePath.indexOf("_") > -1
    ){
      if(filePath.indexOf("?size=") === -1){
        //msg20006-2458:20006_8n_3rw_pRA1u3IqSou
        filePath = filePath.split(":")[1].replace(/_/g,"/")
      }else{
        //msg20006-2458:20006_8n_3rw_pRA1u3IqSou?size=m
        filePath = filePath.split(":")[1].replace(/_/g,"/").split("?")[0]
      }
    }
    console.log("[getFileDate]",{filePath})
    const content = await BigStorage.getInstance().get(filePath)
    switch (type){
      case "buffer":
        return Buffer.from(content)
      case "base64":
      case "string":
        return Buffer.from(content).toString()
      case "hex":
        return Buffer.from(content).toString("hex")
    }
  }
  static async restartWorkerWindow(botId:string){
    if(MainWindowManager.getInstance(botId) && MainWindowManager.getInstance(botId).getMainWindowWebContents()){
      MainWindowManager.getInstance(botId).getMainWindow().close()
    }
    await sleep(1000)
    await new MasterWindowCallbackAction().openWorkerWindow(botId)
  }
}
