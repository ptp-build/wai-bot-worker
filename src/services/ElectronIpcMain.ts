import { ipcMain,BrowserWindow } from 'electron';
import WaiBotRpa from './WaiBotRpa';
import ElectronActions from './ElectronActions';
import Ui from '../ui/Ui';
import PyAutoGuiRpa from './PyAutoGuiRpa';
import { ChatGptWaiChatBot } from './ai/ChatGptWaiChatBot';

const IpcMainCallbackButtonAction = "ipcMainCallbackButton";

export default class ElectronIpcMain{
  private mainWindow: BrowserWindow;
  constructor(mainWindow:BrowserWindow) {
    this.mainWindow = mainWindow
  }
  private sendToRenderMsg: (action: string, payload?: any) => void;
  setSendToRenderMsgHandler(sendToRenderMsg:(action:string,payload?:any)=>void){
    this.sendToRenderMsg = sendToRenderMsg
    return this
  }

  getAdvanceInlineButtons(paload:any){
    const inlineButtons = [
      [
        {
          type:"callback",
          text:"createChatGptBotWorker",
          data:"local/createChatGptBotWorker"
        }
      ],
      [
        {
          type:"callback",
          text:"Debug",
          data:"ipcMain/debug"
        }
      ]
    ];
    this.sendToRenderMsg(IpcMainCallbackButtonAction,{
      ...paload,
      text:"Test",
      inlineButtons
    })
  }
  sendAction(payload:any){
    this.sendToRenderMsg(IpcMainCallbackButtonAction, payload)
  }
  async debug(payload:any) {
    await new ElectronActions(payload.__id,this).getAppInfo()
  }
  async handlePosition(eventData:any){
    const displaySize = Ui.getDisplaySize(this.mainWindow)
    const pyAutoGuiPosition = await new PyAutoGuiRpa().getPositionByPyAutoGui();
    console.log({
      eventData,
      displaySize,
      pyAutoGuiPosition
    })
  }
  async ipcMainCallbackButton({data,...payload}:{__id:number,data:string,eventData?:any}){
    if(data.includes("getButtons")){
      return this.getAdvanceInlineButtons(payload);
    }
    if(data.startsWith("ipcMain/createChatGptBotWorker/")){
      return await new ElectronActions(payload.__id,this).createChatGptBotWorker(data)
    }
    switch (data){
      case "ipcMain/getSize":
        await this.handlePosition(payload.eventData!)
        break
      case "ipcMain/debug":
        await this.debug(payload)
        break
    }
  }
  addEvents(){
    console.log("[ElectronIpcMain addEvents!!!]")
    ipcMain.on('ipcMainMsg', async (event, action,payload) => {
      console.log('[ipcMainMsg]',action)
      switch (action) {
        case "ipcMainCallbackButton":
          this.ipcMainCallbackButton(payload||{}).catch(console.error)
          break
        case 'ping':
          this.sendToRenderMsg("dong")
          break
        case "promptsInputReady":
          await new WaiBotRpa().inputPrompt("promptsInputReady")
          break
        case 'WaiChatGptBotWorkerInit':
          break;
        case 'onRecvChatGptMsg':
          const { text, index, state } = payload;
          if(ChatGptWaiChatBot.getCurrentObj()){
            ChatGptWaiChatBot.getCurrentObj().handleWebChatGptMsg({ text, index, state });
          }
          break
      }
    });
  }
}
