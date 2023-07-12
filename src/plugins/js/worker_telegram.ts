import BaseWorker from '../../sdk/botWorker/BaseWorker';

import {
  ApiChatMsg,
  BotStatusType,
  LocalWorkerAccountType,
  WorkerCallbackButtonAction,
  WorkerEventActions,
} from '../../sdk/types';
import MsgHelper from '../../sdk/helper/MsgHelper';
import TelegramHelper from '../../sdk/helper/TelegramHelper';
import TelegramEvents from './telegram/TelegramEvents';


export enum TgCallbackButtonAction {
  Worker_Tg_CurrentChatId = "Worker_Tg_CurrentChatId",
  Worker_Tg_ChatInfo = "Worker_Tg_ChatInfo",
  Worker_Tg_GetLastMessage = "Worker_Tg_GetLastMessage",
  Worker_Tg_Debug = "Worker_Tg_Debug",
}

class TelegramWorker extends BaseWorker {
  private readonly tgHelper: TelegramHelper;
  private events: TelegramEvents;
  constructor(workerAccount:LocalWorkerAccountType) {
    super(workerAccount);
    this.tgHelper = new TelegramHelper()
    this.events = new TelegramEvents(this,this.tgHelper)
    this.init();
  }
  init() {
    console.log("[BotWorker INIT]",this.botId)
    this.reportStatus(BotStatusType.ONLINE)
    this.reportStatus(BotStatusType.READY)
    this.loop().catch(console.error)
  }

  async loop(){
    const global = this.tgHelper.getGlobal();
    if(global){
      this.statusBot = BotStatusType.ONLINE
      this.reportStatus(BotStatusType.READY)
    }
    this.reportStatus(this.statusBot)
    await this.events.checkMessages()
    setTimeout(async ()=>{
      await this.loop()
    },1000)
  }
  actions(){
    return [
      ...super.actions(),
      [
        this.buildCallBackAction("All Chats",WorkerCallbackButtonAction.Worker_Tg_Chats)
      ],
      [
        this.buildCallBackAction("CurrentChatId",TgCallbackButtonAction.Worker_Tg_CurrentChatId)
      ],
      [
        this.buildCallBackAction("ChatInfo",TgCallbackButtonAction.Worker_Tg_ChatInfo)
      ],
      [
        this.buildCallBackAction("GetLastMessage",TgCallbackButtonAction.Worker_Tg_GetLastMessage)
      ],
      [
        this.buildCallBackAction("Debug",TgCallbackButtonAction.Worker_Tg_Debug)
      ],
    ]
  }

  async handleCallBackButton(payload:{path:string,chatId:string,messageId:number}) {
    const {path,messageId} = payload
    await super.handleCallBackButton(payload)
    if(path.startsWith(WorkerCallbackButtonAction.Worker_Tg_Open_Chat+"/")){
      await this.events.openChat(path.replace(WorkerCallbackButtonAction.Worker_Tg_Open_Chat+"/",""))
    }
    if(path.startsWith(WorkerCallbackButtonAction.Worker_Tg_Chats+"/")){
      await this.events.getChats(Number(path.replace(WorkerCallbackButtonAction.Worker_Tg_Chats+"/","")),messageId)
    }
    switch (path){
      case WorkerCallbackButtonAction.Worker_Tg_Chats:
        return await this.events.getChats()
      case TgCallbackButtonAction.Worker_Tg_ChatInfo:
        return await this.events.getUserInfo()
      case TgCallbackButtonAction.Worker_Tg_CurrentChatId:
        return await this.events.getCurrentChatId()
      case TgCallbackButtonAction.Worker_Tg_GetLastMessage:
        return await this.events.getLastMessage()
      case TgCallbackButtonAction.Worker_Tg_Debug:
        return await this.events.debug()
    }
  }

  async onMessage({text,chatId,updateMessage}:{text:string,chatId:string,updateMessage:ApiChatMsg}){
    await this.updateMessage("recv msg: "+ text,updateMessage.msgId,updateMessage.chatId)
  }
  handleEvent(action:WorkerEventActions, payload:any) {
    super.handleEvent(action, payload)
    switch (action) {
      case WorkerEventActions.Worker_ChatMsg:
        console.log("[Worker_ChatMsg]", JSON.stringify(payload));
        void this.onMessage(payload)
        break;
    }
  }
}

new TelegramWorker(window.WORKER_ACCOUNT as LocalWorkerAccountType).addEvents()

