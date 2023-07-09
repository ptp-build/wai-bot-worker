import BaseWorker from './../../sdk/botWorker/BaseWorker';
import { BotStatusType, LocalWorkerAccountType, WorkerEventActions } from '../../sdk/types';

export default class BotCustom extends BaseWorker {
  constructor(workerAccount:LocalWorkerAccountType) {
    super(workerAccount);
    this.init();
  }
  init() {
    this.reportStatus(BotStatusType.ONLINE)
    this.loop().catch(console.error)
  }

  async loop(){
    setTimeout(async ()=>{
      await this.loop()
    },1000)
  }

  async handleCallBackButton(payload:any) {
    await super.handleCallBackButton(payload)
  }

  handleEvent(action:WorkerEventActions, payload:any) {
    console.log("[handleEvent]",this.botId,action,payload)
    super.handleEvent(action, payload)
    switch (action) {
      case WorkerEventActions.Worker_ChatMsg:
        console.log("[Worker_ChatMsg]", JSON.stringify(payload));
        void this.onMessage(payload)
        break;
    }
  }
}
new BotCustom(window.WORKER_ACCOUNT).addEvents()
