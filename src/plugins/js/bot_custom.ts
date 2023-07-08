import BaseWorker from './../../sdk/botWorker/BaseWorker';
import { BotStatusType, BotWorkerStatusType, LocalWorkerAccountType, WorkerEventActions } from '../../sdk/types';

export default class BotCustom extends BaseWorker {
  constructor(workerAccount:LocalWorkerAccountType) {
    super(workerAccount);
    this.init();
  }
  init() {
    this.statusBot = BotStatusType.ONLINE
    this.loop().catch(console.error)
  }

  async loop(){
    this.statusBotWorker = BotWorkerStatusType.Ready
    this.reportStatus()
    setTimeout(async ()=>{
      await this.loop()
    },1000)
  }
  async onMessage({text,chatId}:{text:string,chatId:string}){

  }
  async handleCallBackButton({ path,messageId }:{path:string,messageId:number}) {
    await super.handleCallBackButton({path})
  }

  handleEvent(action:WorkerEventActions, payload:any) {
    super.handleEvent(action, payload)
    console.log("[handleEvent]",this.botId)
    switch (action) {
      case WorkerEventActions.Worker_ChatMsg:
        console.log("[Worker_ChatMsg]", JSON.stringify(payload));
        void this.onMessage(payload)
        break;
    }
  }
}
new BotCustom(window.WORKER_ACCOUNT).addEvents()
