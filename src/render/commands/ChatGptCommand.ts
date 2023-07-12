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
    const cmdList = [
      ["start","开始对话"],
      ["brain","大脑"],
      ["control","控制指令"],
      ["action","动作指令"],
      ["setting","设置选项"],
      // ["help","使用帮助"],
    ]

    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }
  async start(){
    const account = await this.getWorkerAccount();
    return await super.start(account.bio,this.getShortKeyCmd())
  }

  async setting(){
    const account = await this.getWorkerAccount();

    let helper = " 🛠️️️️ 设置选项:\n\n"
    helper += await this.getSettingHelp(true);

    const buttons = this.getSettingButtons()

    buttons.push(MsgHelper.buildLocalCancel())
    return this.replyText(helper,buttons)
  }

  async action(action?:"reloadWindow" | "openWindow"){
    return super.action(action)
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
