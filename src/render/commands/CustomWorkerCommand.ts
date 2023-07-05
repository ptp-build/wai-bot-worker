import MsgHelper from '../../sdk/helper/MsgHelper';
import { CallbackButtonAction } from '../../sdk/types';
import BaseCommand from './BaseCommand';

export default class CustomWorkerCommand extends BaseCommand{

  constructor(chatId:string,localMsgId?:number) {
    super(chatId,localMsgId)
  }

  async loadBotCommands(){
    const cmdList = [
      ["start","Start conversation."],
      ["control","Control Panel"],
      ["action","Action Panel"],
      ["reloadWindow","Reload Window"],
      ["openWindow","Open Window"],
      ["setting","Setting panel"],
      ["clearHistory","Clear chat History."]
    ]
    console.log(cmdList)
    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }

  async start(){
    return await super.start()
  }
  async setting(){
    let helper = "Setting panel:"
    const buttons = this.getSettingButtons()

    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️️ Home Url",CallbackButtonAction.Local_setupHomeUrl),
    ])
    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️️ Plugin Js",CallbackButtonAction.Local_setupPluginJs),
    ])
    buttons.push([
      MsgHelper.buildCallBackAction("↩️️ Cancel",CallbackButtonAction.Local_cancelMessage),
    ])
    return this.replyText(helper,buttons)
  }

  async action(action?:"reloadWindow" | "openWindow"){
    return super.action(action)
  }

  async processBotCommand(command:string){
    return super.processBotCommand(command)
  }
}
