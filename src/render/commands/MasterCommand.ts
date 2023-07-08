import MsgHelper from '../../sdk/helper/MsgHelper';
import { CallbackButtonAction } from '../../sdk/types';
import BaseCommand from './BaseCommand';
import { encodeCallBackButtonPayload } from '../../sdk/common/string';

export default class MasterCommand extends BaseCommand{

  constructor(chatId:string,localMsgId?:number) {
    super(chatId,localMsgId)
  }

  async loadBotCommands(){
    const cmdList = [
      ["start","Start conversation."],
      ["createWorker","Create Worker"],
      ["control","Control Panel"],
      ["setting","Setting panel"],
      ["clearHistory","Clear chat History."]
    ]

    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }

  async start(){
    return super.start()
  }

  async setting(){
    let helper = "Setting panel:"
    const buttons = []

    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️️ Setup MySql Message storage",CallbackButtonAction.Local_mysqlMsgStorage),
    ])

    buttons.push([
      MsgHelper.buildCallBackAction("↩️️ Cancel",CallbackButtonAction.Local_cancelMessage),
    ])
    return this.replyText(helper,buttons)
  }

  async action(action?:"reloadWindow" | "openWindow"){
    return super.action(action)
  }

  async createWorker(){
    return this.replyText("Choose type below:",[
      [MsgHelper.buildCallBackAction("ChatGpt Worker",encodeCallBackButtonPayload(CallbackButtonAction.Master_createChatGptBotWorker,{
        showConfirm:true,
        confirmText:"Create a ChatGpt Worker ?",
      }))],
      [MsgHelper.buildCallBackAction("Custom Worker",encodeCallBackButtonPayload(CallbackButtonAction.Master_createCustomWorker,{
        showConfirm:true,
        confirmText:"Custom Worker is a worker with window\n Are you sure to create?",
      }))],

      [MsgHelper.buildCallBackAction("Bot",encodeCallBackButtonPayload(CallbackButtonAction.Master_createCommonBot,{
        showConfirm:true,
        confirmText:"Bot is a bot without window\n Are you sure to create?",
      }))],

      // [MsgHelper.buildCallBackAction("Task Worker",CallbackButtonAction.Master_createTaskWorker)],
      // [MsgHelper.buildCallBackAction("Coding Worker",CallbackButtonAction.Master_createCodingWorker)],
      [MsgHelper.buildCallBackAction("↩️️ Cancel",CallbackButtonAction.Local_cancelMessage)],
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
