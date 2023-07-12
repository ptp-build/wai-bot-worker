import BaseWorker from './../../sdk/botWorker/BaseWorker';
import { BotStatusType, LocalWorkerAccountType, WorkerCallbackButtonAction, WorkerEventActions } from '../../sdk/types';

export default class BotCustom extends BaseWorker {
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
    return super.actions(chatId)
  }
  async handleCallBackButton(payload:{path:WorkerCallbackButtonAction,messageId:number,chatId:string}) {
    switch (payload.path){
      case WorkerCallbackButtonAction.Worker_help:
        await this.help(payload.chatId)
        break
      default:
        await super.handleCallBackButton(payload)
        break
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
    }
  }
}
new BotCustom(window.WORKER_ACCOUNT).addEvents()
