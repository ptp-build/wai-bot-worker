import BaseWorker from '../../sdk/botWorker/BaseWorker';

import {
  BotStatusType,
  BotWorkerStatusType,
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
    this.statusBot = BotStatusType.ONLINE
    this.loop().catch(console.error)
  }

  async loop(){
    const global = this.tgHelper.getGlobal();
    if(global){
      this.statusBotWorker = BotWorkerStatusType.Ready
    }
    this.reportStatus()
    await this.events.checkMessages()
    setTimeout(async ()=>{
      await this.loop()
    },1000)
  }
  actions(){
    return [
      ...super.actions(),
      [
        MsgHelper.buildCallBackAction("All Chats",WorkerCallbackButtonAction.Worker_Tg_Chats)
      ],
      [
        MsgHelper.buildCallBackAction("CurrentChatId",TgCallbackButtonAction.Worker_Tg_CurrentChatId)
      ],
      [
        MsgHelper.buildCallBackAction("ChatInfo",TgCallbackButtonAction.Worker_Tg_ChatInfo)
      ],
      [
        MsgHelper.buildCallBackAction("GetLastMessage",TgCallbackButtonAction.Worker_Tg_GetLastMessage)
      ],
      [
        MsgHelper.buildCallBackAction("Debug",TgCallbackButtonAction.Worker_Tg_Debug)
      ],
    ]
  }

  async handleCallBackButton({ path,messageId }:{path:string,messageId:number}) {
    await super.handleCallBackButton({path})
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
  handleEvent(action:WorkerEventActions, payload:any) {
    super.handleEvent(action, payload)
    switch (action) {
      case WorkerEventActions.Worker_ChatMsg:
        console.log("[Worker_ChatMsg]", JSON.stringify(payload));
        break;
    }
  }
}

new TelegramWorker(window.WORKER_ACCOUNT as LocalWorkerAccountType).addEvents()

