import { ipcMain,BrowserWindow } from 'electron';
import WaiBotRpa from './WaiBotRpa';
import ElectronActions from './ElectronActions';
import Ui from '../ui/Ui';
import PyAutoGuiRpa from './PyAutoGuiRpa';
import { ChatGptWaiChatBot } from './ai/ChatGptWaiChatBot';
import { sleep } from '../../worker/share/utils/utils';

const IpcMainCallbackButtonAction = "ipcMainCallbackButton";

export default class ElectronIpcMain{
  private mainWindow: BrowserWindow;
  constructor(mainWindow:BrowserWindow) {
    this.mainWindow = mainWindow
  }
  private sendToRenderMsg?: (action: string, payload?: any) => void;
  setSendToRenderMsgHandler(sendToRenderMsg:(action:string,payload?:any)=>void){
    this.sendToRenderMsg = sendToRenderMsg
    return this
  }

  getAdvanceInlineButtons(data:string,paload:any){
    const chatId = data.split("/")[data.split("/").length - 1]
    let inlineButtons;
    if(chatId === "1000"){
      inlineButtons = [
        [
          {
            type:"callback",
            text:"创建 ChatGpt Bot Worker",
            data:"local/createChatGptBotWorker"
          }
        ],
        [
          {
            type:"callback",
            text:"获取App信息",
            data:"ipcMain/appInfo"
          }
        ]
      ];
    }else{
      inlineButtons = [
        [
          {
            type:"callback",
            text:"打开窗口",
            data:"local/createChatGptBotWorker"
          }
        ],
        [
          {
            type:"callback",
            text:"获取App信息",
            data:"ipcMain/appInfo"
          }
        ]
      ];
    }

    this.sendToRenderMsg!(IpcMainCallbackButtonAction,{
      ...paload,
      text:"本地机器人",
      inlineButtons
    })
  }
  sendAction(payload:any){
    this.sendToRenderMsg!(IpcMainCallbackButtonAction, payload)
  }
  async debug(payload:any) {
    await new ElectronActions(payload.__id,this).getAppInfo()
  }
  async appInfo(payload:any) {
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
      return this.getAdvanceInlineButtons(data,payload);
    }
    if(data.startsWith("ipcMain/createChatGptBotWorker/")){
      return await new ElectronActions(payload.__id,this).createChatGptBotWorker(data)
    }
    switch (data){
      case "ipcMain/getSize":
        await this.handlePosition(payload.eventData!)
        break
      case "ipcMain/appInfo":
        await this.appInfo(payload)
        break
    }
  }
  addEvents(){
    console.log("[ElectronIpcMain addEvents!!!]")
    ipcMain.on('ipcMainMsg', async (event, action,payload) => {
      //console.log('[ipcMainMsg]',action)
      switch (action) {
        case "ipcMainCallbackButton":
          this.ipcMainCallbackButton(payload||{}).catch(console.error)
          break
        case 'MsgAction_WaiChatGptBotWorkerInit':
          break;
        case 'MsgAction_WaiChatGptInputUsername':
          ChatGptWaiChatBot.inputUsername(payload);
          break;
        case 'MsgAction_WaiChatGptClickLogin':
          ChatGptWaiChatBot.clickLogin(payload);
          break;
        case 'MsgAction_WaiChatGptInputPassword':
          ChatGptWaiChatBot.inputPassword(payload);
          break;
        case "MsgAction_WaiChatGptPromptsInputReady":
          console.log("[promptsInputReady]!!")
          await sleep(2000)
          await new WaiBotRpa().askMsg("ping ,you reply:pong!!!!")
          break
        case 'MsgAction_WaiChatGptOnRecvMsg':
          const { text, index, state } = payload;
          ChatGptWaiChatBot.handleWebChatGptMsg({ text, index, state });
          break
      }
    });
  }
}
