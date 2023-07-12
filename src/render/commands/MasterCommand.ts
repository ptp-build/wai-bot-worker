import MsgHelper from '../../sdk/helper/MsgHelper';
import { CallbackButtonAction } from '../../sdk/types';
import BaseCommand from './BaseCommand';
import { encodeCallBackButtonPayload } from '../../sdk/common/string';

export default class MasterCommand extends BaseCommand{

  constructor(chatId:string,localMsgId?:number,botId?:string) {
    super(chatId,localMsgId,botId)
  }

  async loadBotCommands(){
    const cmdList = [
      ["start","开始对话"],
      ["createWorker","创建Worker"],
      ["control","控制指令"],
      ["setting","设置选项"],
    ]
    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }

  async start(){
    return super.start()
  }

  async setting(){
    let helper = "🛠️️️ 设置选项:"
    helper += await this.getSettingHelp();
    const buttons = []

    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️️ 设置MySql存储",CallbackButtonAction.Local_mysqlMsgStorage),
    ])

    buttons.push(MsgHelper.buildLocalCancel())
    return this.replyText(helper,buttons)
  }

  async action(action?:"reloadWindow" | "openWindow"){
    return super.action(action)
  }

  async createWorker(){
    let text = ""
    text += `🟦 选择创建类别：\n\n`

    text += `💡 Workers 与 Bots区别:\n\n`
    text += `- Workers: 带窗口，需要登录账号\n`
    text += `- Bots: 调用官方平台的api，需要apiKey或者Token，主要应用于通知、工具场景\n`
    return this.replyText(text,[
      [MsgHelper.buildUnsupportedAction("Workers:")],
      [MsgHelper.buildCallBackAction("🔥🔥🔥 ChatGpt Worker",CallbackButtonAction.Master_createCustomWorker,{
        type:"chatGpt",
        customWorkerUrl:"https://chat.opanai.com",
        pluginJs:"worker_chatGpt.js",
        showConfirm:true,
        confirmText:"确定要创建 ?",
      })],
      [MsgHelper.buildCallBackAction("🔥 ProtonMail Worker",CallbackButtonAction.Master_createCustomWorker,{
        type:"custom",
        customWorkerUrl:"https://mail.proton.me",
        pluginJs:"worker_custom.js",
        showConfirm:true,
        confirmText:"确定要创建 ?",
      })],
      [MsgHelper.buildCallBackAction("🔥 Twitter Worker",CallbackButtonAction.Master_createCustomWorker,{
        type:"custom",
        customWorkerUrl:"https://www.twitter.com",
        pluginJs:"worker_custom.js",
        showConfirm:true,
        confirmText:"确定要创建 ?",
      })],
      [MsgHelper.buildCallBackAction("🌏 自定义 Worker",CallbackButtonAction.Master_createCustomWorker,{
        type:"custom",
        pluginJs:"worker_custom.js",
        showConfirm:true,
        confirmText:"确定要创建 ?",
      })],
      [MsgHelper.buildUnsupportedAction("Bots:")],
      [MsgHelper.buildCallBackAction("🔥🔥🔥 ChatGpt4 Bot",CallbackButtonAction.Master_createCustomWorker,{
        type:"bot",
        pluginJs:"bot_chatGpt.js",
        botType:"chatGptBot",
        showConfirm:true,
        chatGptModel:"gpt-4",
        confirmText:"确定要创建 ?",
      })],
      [MsgHelper.buildCallBackAction("🔥🔥🔥 ChatGpt3.5 Bot",CallbackButtonAction.Master_createCustomWorker,{
        type:"bot",
        chatGptModel:"gpt-3.5-turbo",
        pluginJs:"bot_chatGpt.js",
        botType:"chatGptBot",
        showConfirm:true,
        confirmText:"确定要创建 ?",
      })],
      [MsgHelper.buildCallBackAction("🔥🔥🔥 Telegram Bot",CallbackButtonAction.Master_createCustomWorker,{
        type:"bot",
        pluginJs:"bot_telegram.js",
        botType:"telegramBot",
        showConfirm:true,
        confirmText:"确定要创建 ?",
      })],
      [MsgHelper.buildCallBackAction("🛸 自定义 Bot",CallbackButtonAction.Master_createCustomWorker,{
        type:"bot",
        pluginJs:"bot_custom.js",
        showConfirm:true,
        confirmText:"确定要创建 ?",
      })],

      MsgHelper.buildLocalCancel(),
    ])
  }
  async processBotCommand(command:string){
    const ack = super.processBotCommand(command)
    switch (command){
      case "createWorker":
        return await this.createWorker()
    }
    return  ack
  }
}
