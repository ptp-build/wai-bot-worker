import MsgHelper from '../../sdk/helper/MsgHelper';
import { CallbackButtonAction } from '../../sdk/types';
import BaseCommand from './BaseCommand';

export default class CustomWorkerCommand extends BaseCommand{

  constructor(chatId:string,localMsgId?:number,botId?:string) {
    super(chatId,localMsgId,botId)
  }

  async loadBotCommands(){
    const cmdList = [
      ["start","开始对话"],
      ["control","控制指令"],
      ["action","动作指令"],
      ["setting","设置选项"],
      // ["help","使用帮助"],
    ]
    console.log(cmdList)
    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }

  async start(){
    const account = await this.getWorkerAccount();
    return await super.start(account.bio,this.getShortKeyCmd())
  }
  async setting(){
    let helper = " 🛠️️️️ 设置选项:\n\n"
    helper += await this.getSettingHelp(true);
    const buttons = this.getSettingButtons()

    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️️ 设置主页",CallbackButtonAction.Local_setupHomeUrl),
    ])
    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️️ 设置插件Js",CallbackButtonAction.Local_setupPluginJs),
    ])
    buttons.push(MsgHelper.buildLocalCancel())
    return this.replyText(helper,buttons)
  }

  async action(action?:"reloadWindow" | "openWindow"){
    return super.action(action)
  }

  async processBotCommand(command:string){
    return super.processBotCommand(command)
  }
}
