import MsgHelper from '../../sdk/helper/MsgHelper';
import { CallbackButtonAction, LocalWorkerAccountType } from '../../sdk/types';
import ChatConfig from '../../window/ChatConfig';
import KvCache from '../../worker/services/kv/KvCache';
import WorkerAccount from '../../window/woker/WorkerAccount';
import BaseCommand from './BaseCommand';
import BridgeWorkerWindow from '../../sdk/bridge/BridgeWorkerWindow';
import BotWorkerStatus from '../../sdk/botWorkerStatus/BotWorkerStatus';

export default class ChatGptCommand extends BaseCommand{

  constructor(chatId:string,localMsgId?:number,botId?:string) {
    super(chatId,localMsgId,botId)
  }

  async loadBotCommands(){
    const enableMultipleQuestion = await ChatConfig.isEnableMultipleQuestion(this.getChatId())
    let cmdList
    if(enableMultipleQuestion){
      cmdList = [
        ["start","Start conversation."],
        ["control","Control Panel"],
        ["setting","Setting panel"],
        ["action","Action panel"],
        ["reloadWindow","Reload Window"],
        ["activeWindow","Active Window"],
        ["openWindow","Open Window"],
        // ["disableMultipleQuestions","Disable multiple lines of questioning."],
        // ["sendQuestions","Send the above questions to AI"],
        ["clearHistory","Clear chat History."],
      ]
    }else{
      cmdList = [
        ["start","Start conversation."],
        ["setting","Setting panel"],
        ["action","Action panel"],
        ["reloadWindow","Reload Window"],
        ["activeWindow","Active Window"],
        ["openWindow","Open Window"],
        ["control","Control Panel"],
        // ["multipleQuestions","Enable Multiple lines of questioning"],
        ["clearHistory","Clear chat History."],
      ]
    }

    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }

  async start(){
    return super.start()
  }

  async setting(){
    let helper = "Setting panel:"
    const buttons = this.getSettingButtons()

    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️ ChatGpt Auth",CallbackButtonAction.Local_setupChatGptAuth),
      MsgHelper.buildCallBackAction("🛠️️️ Plugin Js",CallbackButtonAction.Local_setupPluginJs),
    ])

    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️ Role",CallbackButtonAction.Render_setupChatGptRole),
    ])

    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️ Prompt Format",CallbackButtonAction.Local_setupPromptFormat),
      MsgHelper.buildCallBackAction("🛠️️ Reply Parser",CallbackButtonAction.Local_setupReplyParser),
    ])
    buttons.push([
      MsgHelper.buildCallBackAction("↩️️ Cancel",CallbackButtonAction.Local_cancelMessage),
    ])
    return this.replyText(helper,buttons)
  }

  async action(action?:"reloadWindow" | "openWindow"){
    return super.action(action)
  }

  async cancelSetupChatGptRole(){
    await KvCache.getInstance().delete(`setupChatGptRole_${this.getChatId()}`)
  }

  async isSetupChatGptRole(){
    return await KvCache.getInstance().get(`setupChatGptRole_${this.getChatId()}`)
  }

  async setupChatGptRoleText(text:string){
    await this.cancelSetupChatGptRole()
    const account = await this.getWorkerAccount()
    const newAccount = {
      ...account as LocalWorkerAccountType,
      chatGptRole:text
    }
    await new WorkerAccount(this.getChatId()).update(newAccount)
    await new BridgeWorkerWindow(this.getChatId()).updateWorkerAccount(newAccount)
  }
  async sendRoleDirectly(messageId:number){
    if(!await this.isSetupChatGptRole()){
      return
    }
    if(!BotWorkerStatus.getIsReadyByBotId(this.getChatId())){
      await this.replyNewMessage("Worker is offline",[
        MsgHelper.buildLocalCancel()
      ])
      return
    }
    await this.cancelSetupChatGptRole()
    const {chatGptRole} = await this.getWorkerAccount()
    let text = "";
    text += `\nCurrent Role is :${MsgHelper.formatCodeTextMsg(chatGptRole!,"")}\n\n`
    await this.handleUpdateMessage({
      msgId:messageId,
      chatId:this.getChatId(),
      text,
      inlineButtons:[]
    })

    await this.replyNewMessage(chatGptRole!,[],true,true)
    await this.askChatGptMessage(chatGptRole!)
  }
  async setupChatGptRole(){
    const {chatGptRole} = await this.getWorkerAccount()
    let text = "";
    const buttons:any[] = []
    if(chatGptRole){
      text += `\nCurrent Role is :${MsgHelper.formatCodeTextMsg(chatGptRole,"")}\n\n`
      buttons.push([MsgHelper.buildCallBackAction("Send Role Directly",CallbackButtonAction.Render_sendRoleDirectly)])
    }
    buttons.push(MsgHelper.buildRenderCancel(undefined,{
      cancelSetupChatGptRole:true
    }))
    await KvCache.getInstance().put(`setupChatGptRole_${this.getChatId()}`,true)
    text += "Ok! Please typing the role you want me to play:"
    await this.replyNewMessage(text,buttons)
  }
  async processBotCommand(command:string){
    return super.processBotCommand(command)
  }
}
