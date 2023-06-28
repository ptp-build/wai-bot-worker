import MsgHelper from "../masterChat/MsgHelper";
import {ipcRenderer} from "electron";
import {CallbackButtonAction, WindowActions, WorkerCallbackButtonAction} from "../types";
import {parseCallBackButtonPayload} from "../utils/utils";
import WorkerAccount from "../window/woker/WorkerAccount";
import RenderChatMsg from "./RenderChatMsg";
import RenderChatMsgCommand from "./RenderChatMsgCommand";

export default class RenderCallbackButton extends RenderChatMsg{
  private data?: string;
  private token?: string;
  private payload?: Pick<any, string | number | symbol>;
  private path?: string;
  private messageId: any;
  constructor(chatId:string) {
    super(chatId)
  }

  async refreshControlPanel(){
    const {messageId} = this
    await new RenderChatMsgCommand(this.getChatId()).control(messageId)
  }

  async process(data:string,token:string){
    this.data = data
    this.token = token
    const {path,params} = parseCallBackButtonPayload(data)
    const {chatId,messageId,...payload} = params
    this.payload = payload;
    this.path = path
    this.messageId = messageId
    switch (path){
      case CallbackButtonAction.Render_resendAiMsg:
        await new RenderChatMsg(this.getChatId()).resendAiMsg(this.messageId)
        break
      case CallbackButtonAction.Render_refreshControlPanel:
        await this.refreshControlPanel()
        break
      case CallbackButtonAction.Render_saveWorkerAccount:
        const account = new WorkerAccount(this.getChatId())
        await account.updateWorkersAccount({
          ...this.payload!.account
        })
        break
      case CallbackButtonAction.Render_saveWorkerAccountChatGptAuth:
        const account1 = new WorkerAccount(this.getChatId())
        await account1.updateWorkersAccount({
          ...await account1.getWorkersAccount(),
          chatGptAuth:this.payload!.chatGptAuth
        })
        break
      case CallbackButtonAction.Render_saveWorkerAccountProxy:
        const account2 = new WorkerAccount(this.getChatId())
        await account2.updateWorkersAccount({
          ...await account2.getWorkersAccount(),
          proxy:this.payload!.proxy
        })
        break
    }
    console.log("[RenderCallbackButton]",path)
    if(MsgHelper.isMasterWindowCallbackButtonAction(path as CallbackButtonAction)){
      await ipcRenderer.invoke(WindowActions.MasterWindowCallbackAction,this.data)
    }
    if(MsgHelper.isWorkerCallbackButtonAction(path as WorkerCallbackButtonAction)){
      await ipcRenderer.invoke(WindowActions.WorkerWindowCallbackAction,this.data)
    }
  }
}
