import MsgHelper from '../masterChat/MsgHelper';
import { ipcRenderer } from 'electron';
import { CallbackButtonAction, WindowActions, WorkerCallbackButtonAction, WorkerEventActions } from '../types';
import { parseCallBackButtonPayload } from '../utils/utils';
import WorkerAccount from '../window/woker/WorkerAccount';
import RenderChatMsg from './RenderChatMsg';
import RenderChatMsgCommand from './RenderChatMsgCommand';
import RenderChatMsgText from './RenderChatMsgText';
import RenderBotWorkerStatus from './RenderBotWorkerStatus';
import ChatGptCommand from './commands/ChatGptCommand';
import Bridge from './Bridge';

export default class RenderCallbackButton extends RenderChatMsg{
  private data?: string;
  private token?: string;
  private payload?: Pick<any, string | number | symbol>;
  private path?: string;
  private messageId: any;
  constructor(chatId:string) {
    super(chatId)
  }
  async workerStatus(){
    await this.replyNewMessage(MsgHelper.formatCodeTextMsg(JSON.stringify(RenderBotWorkerStatus.getAllBotWorkersStatus(),null,2)))
  }
  async refreshControlPanel(){
    await new RenderChatMsgCommand(this.getChatId()).processBotCommand("/control")
  }
  async cancelMessage(){
    const {payload} = this
    const {cancelSetupChatGptRole} = payload || {}
    if(cancelSetupChatGptRole){
      await new ChatGptCommand(this.getChatId()).cancelSetupChatGptRole()
    }
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
      case CallbackButtonAction.Render_sendRoleDirectly:
        return await new ChatGptCommand(this.getChatId()).sendRoleDirectly(this.messageId)
      case CallbackButtonAction.Render_setupChatGptRole:
        return await new ChatGptCommand(this.getChatId()).setupChatGptRole()
      case CallbackButtonAction.Render_cancelMessage:
        return await this.cancelMessage()
      case CallbackButtonAction.Render_workerStatus:
        return await this.workerStatus()
      case CallbackButtonAction.Render_resendAiMsg:
        await new RenderChatMsgText(this.getChatId()).resendAiMsg(this.messageId)
        break
      case CallbackButtonAction.Render_refreshControlPanel:
        await this.refreshControlPanel()
        break
      case CallbackButtonAction.Render_saveWorkerAccount:
        const account = new WorkerAccount(this.getChatId())
        await account.updateWorkersAccount(this.payload!.account)
        await Bridge.sendEventActionToWorker(this.getChatId(),WorkerEventActions.Worker_UpdateWorkerAccount, this.payload!.account)
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
