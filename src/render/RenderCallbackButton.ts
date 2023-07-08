import MsgHelper from '../sdk/helper/MsgHelper';
import { ipcRenderer } from 'electron';
import { CallbackButtonAction, WindowActions, WorkerCallbackButtonAction } from '../sdk/types';
import WorkerAccount from '../window/woker/WorkerAccount';
import RenderChatMsg from './RenderChatMsg';
import RenderChatMsgCommand from './RenderChatMsgCommand';
import RenderChatMsgText from './RenderChatMsgText';
import ChatGptCommand from './commands/ChatGptCommand';
import BridgeWorkerWindow from '../sdk/bridge/BridgeWorkerWindow';
import { encodeCallBackButtonPayload, parseCallBackButtonPayload } from '../sdk/common/string';
import BotWorkerStatus from '../sdk/botWorkerStatus/BotWorkerStatus';
import WorkerGroup from '../window/woker/WorkerGroup';
import { User } from '../worker/models/user/User';
import { DefaultAdminMembersById, DefaultGroupInfo } from '../sdk/setting';
import { currentTs } from '../sdk/common/time';

export default class RenderCallbackButton extends RenderChatMsg{
  private data?: string;
  private token?: string;
  private payload?: Pick<any, string | number | symbol>;
  private path?: string;
  private messageId: any;
  constructor(chatId:string,localMsgId?:number) {
    super(chatId,localMsgId)
  }
  async workerStatus(){
    await this.replyNewMessage(MsgHelper.formatCodeTextMsg(JSON.stringify(BotWorkerStatus.getAllBotWorkersStatus(),null,2)))
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
      case CallbackButtonAction.Render_updateWorkerGroup:
        const group = new WorkerGroup(this.getChatId())
        await group.update(payload.group)
        break
      case CallbackButtonAction.Render_updateWorkerAccount:
        const account1 = new WorkerAccount(this.getChatId())
        const workerAccount = await account1.get()
        const workerAccount1 = {
          ...workerAccount,
          ...this.payload!.account,
        }
        await account1.update(workerAccount1)
        await new BridgeWorkerWindow(this.getChatId()).updateWorkerAccount(workerAccount1)
        break
      case CallbackButtonAction.Render_saveWorkerAccount:
        const account = new WorkerAccount(this.getChatId())
        await account.update(this.payload!.account)
        await new BridgeWorkerWindow(this.getChatId()).updateWorkerAccount(this.payload!.account)
        break
      case CallbackButtonAction.Render_addWorkerAccount:
        const botId = await User.genUserId()
        const account2 = new WorkerAccount(botId)
        const fromAccount = this.payload!.account;
        const {username,name} = WorkerAccount.getDefaultName(botId,fromAccount.type)
        const newAccount = {
          ...this.payload!.account,
          botId,
          username,name
        }
        await account2.update(newAccount)
        return newAccount
      case CallbackButtonAction.Render_createWorkerGroup:
        const botId1 = "-" + await User.genUserId()
        const adminBotId = payload.adminBotId
        const groupInfo = DefaultGroupInfo
        groupInfo.chatInfo.id = botId1
        groupInfo.chatInfo.membersCount = 1
        groupInfo.chatInfo.title = `Group_${botId1.substring(1)}`
        // @ts-ignore
        groupInfo.chatInfoFull.adminMembersById[adminBotId] = {
          ...DefaultAdminMembersById,
          userId:adminBotId
        }
        groupInfo.chatInfoFull.members = [
          {
            isAdmin: true,
            userId: adminBotId,
            joinedDate: currentTs()
          }
        ]
        await new WorkerGroup(botId1).update(groupInfo)
        return groupInfo
    }
    console.log("[RenderCallbackButton]",path)
    if(MsgHelper.isMasterWindowCallbackButtonAction(path as CallbackButtonAction)){
      await RenderCallbackButton.invokeMasterWindowCallbackButton(this.data)
    }
    if(MsgHelper.isWorkerCallbackButtonAction(path as WorkerCallbackButtonAction)){
      await RenderCallbackButton.invokeWorkerWindowCallbackButton(this.data)
    }
  }

  static invokeMasterWindowCallbackButton(data:string,params?:any){
    const res = parseCallBackButtonPayload(data)
    return ipcRenderer.invoke(WindowActions.MasterWindowCallbackAction,encodeCallBackButtonPayload(res.path,{
      ...(params||{}),
      ...(res.params||{}),
    }))
  }

  static invokeWorkerWindowCallbackButton(data:string,params?:any){
    const res = parseCallBackButtonPayload(data)
    return ipcRenderer.invoke(WindowActions.WorkerWindowCallbackAction,encodeCallBackButtonPayload(res.path,{
      ...(params||{}),
      ...(res.params||{}),
    }))
  }

}
