import BaseWorker from './../../sdk/botWorker/BaseWorker';
import {
  BotStatusType,
  CallbackButtonAction,
  LocalWorkerAccountType,
  WorkerCallbackButtonAction,
  WorkerEventActions,
} from '../../sdk/types';
import MsgHelper from '../../sdk/helper/MsgHelper';
import { TelegramBot } from '../../worker/services/third_party/Telegram';


export default class BotTelegram extends BaseWorker {
  constructor(workerAccount:LocalWorkerAccountType) {
    super(workerAccount);
    this.init();
  }
  init() {
    this.reportStatus(BotStatusType.ONLINE)
    this.reportStatus(BotStatusType.READY)
    this.loop().catch(console.error)
  }

  async loop(){
    setTimeout(async ()=>{
      await this.loop()
    },1000)
  }

  getActionTips(tips?:string){
    return super.getActionTips()
  }

  actions(chatId:string){
    const actions =  super.actions(chatId)
    actions.push([
      MsgHelper.buildCallBackAction("🔑 设置 Telegram Bot Token",CallbackButtonAction.Local_setupTelegramBotToken)
    ])
    actions.push([
      MsgHelper.buildCallBackAction("📡 设置 Telegram 通知群组 ChatId",CallbackButtonAction.Local_setupTelegramBotNotifyChatId)
    ])
    actions.push([
      MsgHelper.buildCallBackAction("🔃 获取机器人更新","Worker_Telegram_getUpdates")
    ])
    return actions
  }
  async help(chatId:string){
    let text = "\n🎓使用帮助\n";
    text += "\n💡 如何获取设置 Telegram 机器人 Token\n";
    text += "\n1️⃣ 打开 Telegram app ";
    text += "\n2️⃣ 找到 @BotFather ";
    text += "\n3️⃣ 发送 /newBot";
    text += "\n4️⃣ 创建完成之后找到 Token (类似于:1930672150:AAGxxx5BBadyU)";
    text += "\n5️⃣ 点击下方 🔑 Telegram Bot Token 并输入保存";
    text += "\n\n"
    text += "\n💡 如何 设置 Telegram 通知群组 ChatId\n";
    text += "\n1️⃣ 打开 Telegram app 中 创建的 Bot ,并创建新的群组或者添加Bot到已有群组";
    text += "\n2️⃣ 回到本软件 发送/action";
    text += "\n3️⃣ 点击 🔃 获取机器人更新";
    text += "\n4️⃣ 打开JSON文件 找含有 group_chat_created的message, chat.id即为通知群组 ChatId，一般以'-'开头";
    text += "\n5️⃣ 点击下方 🔑 Telegram Bot Token 并输入保存";

    return this.reply(chatId,text,true)
  }

  async handleCallBackButton(payload:{path:string| WorkerCallbackButtonAction|CallbackButtonAction,messageId:number,chatId:string}) {
    const {telegramBotToken} = this.getWorkerAccount()

    switch (payload.path){
      case "Worker_Telegram_getUpdates":
        const msgId = await this.applyMsgId(this.botId)
        if(!telegramBotToken){
          await this.replyMsg({
            chatId:payload.chatId || this.botId,
            msgId,
            text:"Telegram Bot Token 没有设置！\n请发送 /help 寻求帮助"
          })
          return
        }
        const update = await new TelegramBot(telegramBotToken).getUpdates(-1,1);
        await this.replyJsonFile(`updates_${payload.chatId}.json`,update)
        break
      case WorkerCallbackButtonAction.Worker_help:
        await this.help(payload.chatId)
        break
      default:
        await super.handleCallBackButton(payload)
        break
    }
  }

  async onMessage({text,chatId}:{text:string,chatId:string}){
    const msgId = await this.applyMsgId(this.botId)

    const {telegramBotToken,telegramBotNotifyChatId} = this.getWorkerAccount()
    if(!telegramBotToken){
      await this.replyMsg({
        chatId:chatId || this.botId,
        msgId,
        text:"Telegram Bot Token 没有设置！\n请发送 /help 寻求帮助"
      })
      return
    }
    if(!telegramBotNotifyChatId){
      await this.replyMsg({
        chatId:chatId || this.botId,
        msgId,
        text:"Telegram 通知群组 ChatId 没有设置！\n请发送 /help 寻求帮助"
      })
      return
    }
    try {
      const json = await new TelegramBot(telegramBotToken).replyText(text,telegramBotNotifyChatId)
      if(!json.ok){
        await this.replyMsg({
          chatId:chatId || this.botId,
          msgId,
          text:"发送失败:\n" + MsgHelper.formatCodeTextMsg(JSON.stringify(json,null,2))
        })
      }
    }catch (e){
      console.error(e)
      await this.replyMsg({
        chatId:chatId || this.botId,
        msgId,
        text:"发送失败"
      })
    }
  }

  handleEvent(action:WorkerEventActions, payload:any) {
    console.log("[handleEvent]",this.botId,action,payload)

    switch (action) {
      case WorkerEventActions.Worker_ChatMsg:
        console.log("[Worker_ChatMsg]", JSON.stringify(payload));
        void this.onMessage(payload)
        break;
      default:
        super.handleEvent(action, payload)
        break
    }
  }
}
new BotTelegram(window.WORKER_ACCOUNT).addEvents()
