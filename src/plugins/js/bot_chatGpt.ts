import BaseWorker from './../../sdk/botWorker/BaseWorker';
import {
  BotStatusType,
  CallbackButtonAction, ChatGptModelTypes,
  LocalWorkerAccountType,
  WorkerCallbackButtonAction,
  WorkerEventActions,
} from '../../sdk/types';
import MsgHelper from '../../sdk/helper/MsgHelper';
import BridgeMasterWindow from '../../sdk/bridge/BridgeMasterWindow';

export default class BotChatGpt extends BaseWorker {
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
    return super.getActionTips(`
    支持模型: ${ChatGptModelTypes.join(" / ")}
    `)
  }
  actions(chatId:string){
    const actions =  super.actions(chatId)
    actions.push([
      MsgHelper.buildCallBackAction("🔑 ApiKey",CallbackButtonAction.Local_setupOpenAiApiKey)
    ])
    actions.push([
      MsgHelper.buildCallBackAction("🧩 模型",CallbackButtonAction.Local_setupChatGptModel)
    ])
    return actions
  }
  async help(chatId:string){
    let text = "\n🎓使用帮助\n";
    text += "\n💡 ChatGpt Bot 与 ChatGpt Worker的区别是什么?\n";
    text += "\n1️⃣ ChatGpt Bot 是使用apiKey的机器人,直接调用官方接口";
    text += "\n2️⃣ ChatGpt Worker 是使用浏览器窗口机器人,无需apiKey,需要录您的openAi账号";

    return this.reply(chatId,text,true)
  }

  async handleCallBackButton(payload:{path:string| WorkerCallbackButtonAction|CallbackButtonAction,messageId:number,chatId:string}) {

    switch (payload.path){
      case WorkerCallbackButtonAction.Worker_help:
        await this.help(payload.chatId)
        break
      default:
        await super.handleCallBackButton(payload)
        break
    }
  }
  async requestApi(msgId:number,chatId:string,body:any,openAiApiKey:string){
    const account = this.getWorkerAccount()
    return await new BridgeMasterWindow().requestOpenAi({
      msgId,chatId,body,openAiApiKey,account
    })
  }
  async onMessage({text,chatId}:{text:string,chatId:string}){
    const msgId = await this.applyMsgId(this.botId)
    let {chatGptModel,chatGptRole,openAiApiKey} = this.getWorkerAccount()
    if(!openAiApiKey){
      await this.replyMsg({
        chatId:chatId || this.botId,
        msgId,
        text:"ApiKey 没有设置！\n请发送 /action 设置 ApiKey"
      })
      return
    }
    if(!chatGptModel){
      chatGptModel = "gpt-3.5-turbo"
    }
    // let messages = []
    // if(chatGptRole){
    //   messages.push({
    //     role:"system",
    //     content:chatGptRole || ""
    //   })
    // }
    const body = {
      stream: true,
      model: chatGptModel,
      temperature: 0.5,
      max_tokens: 1000,
      presence_penalty: 0,
      messages:[
        // ...messages,
        {
          role:"user",
          content:chatGptRole + text
        }
      ]
    }

    await this.replyMsg({
      chatId:chatId || this.botId,
      msgId,
      text:"..."
    })
    await this.requestApi(msgId,chatId,body,openAiApiKey)
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
new BotChatGpt(window.WORKER_ACCOUNT).addEvents()
