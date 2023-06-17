import { ipcMain } from 'electron';
import MainWindowManager, { MasterWindowBotId } from '../ui/MainWindowManager';
import ElectronMasterIpcMainEvents from './events/ElectronMasterIpcMainEvents';
import ElectronWorkerIpcMainEvents from './events/ElectronWorkerIpcMainEvents';

const IpcMainCallbackButtonAction = "ipcMainCallbackButton";

export default class ElectronIpcMain{
  private botId: string;
  constructor(botId:string) {
    this.botId = botId
  }

  sendAction(payload:any){
    return MainWindowManager.getInstance(this.botId).sendToRenderMsg(IpcMainCallbackButtonAction,{
      ...payload,
    })
  }


  async handleEvent(action:string,payload:any){
    if (this.botId === MasterWindowBotId){
      return new ElectronMasterIpcMainEvents(this.botId,payload.__id || "").handleEvent(action,payload)
    }else{
      return new ElectronWorkerIpcMainEvents(this.botId,payload.__id || "").handleEvent(action,payload)
    }
  }
  static addEvents(){
    console.log("[ElectronIpcMain addEvents!!!]")
    ipcMain.on('ipcMainMsg', async (event, action,payload) => {
      const {__botId} = payload || {}
      console.debug("[ipcMainMsg]",__botId,action,payload)
      await new ElectronIpcMain(__botId).handleEvent(action,payload)
    });
  }
}
