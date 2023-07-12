import MsgHelper from '../../sdk/helper/MsgHelper';
import { CallbackButtonAction } from '../../sdk/types';
import BaseCommand from './BaseCommand';

export default class CustomBotCommand extends BaseCommand{

  constructor(chatId:string,localMsgId?:number,botId?:string) {
    super(chatId,localMsgId,botId)
  }

  async loadBotCommands(){
    const account = await this.getWorkerAccount();
    let cmdList
    if(account.botType === 'chatGptBot'){
      cmdList = [
        ["start","开始对话"],
        ["brain","大脑"],
        ["control","控制指令"],
        ["action","动作指令"],
        ["setting","设置选项"],
        ["help","使用帮助"],
      ]
    }else{
      cmdList = [
        ["start","开始对话"],
        ["control","控制指令"],
        ["action","动作指令"],
        ["setting","设置选项"],
        ["help","使用帮助"],
      ]
    }
    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }

  async start(){
    const account = await this.getWorkerAccount();
    return await super.start(account.bio)
  }

  async setting(){
    let helper = " 🛠️️️️ 设置选项:\n\n"
    helper += await this.getSettingHelp();
    const buttons = []
    buttons.push([
      MsgHelper.buildCallBackAction("🆔️️ 用户名",CallbackButtonAction.Local_setupWorkerUserName),
    ])

    buttons.push([
      MsgHelper.buildCallBackAction("👤 名称",CallbackButtonAction.Local_setupWorkerName),
      MsgHelper.buildCallBackAction("📝️ 简介",CallbackButtonAction.Local_setupWorkerBio),
    ])
    const account = await this.getWorkerAccount();

    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️️ 插件Js",CallbackButtonAction.Local_setupPluginJs),
    ])

    buttons.push(MsgHelper.buildLocalCancel())
    return this.replyText(helper,buttons)
  }

  async action(action:any){
    return super.action()
  }

  async processBotCommand(command:string){
    switch (command){
      case "brain":
        return await this.brain()
      default:
        return super.processBotCommand(command)
    }
  }
}
