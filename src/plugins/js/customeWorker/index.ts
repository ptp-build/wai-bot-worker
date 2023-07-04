import BaseWorker from '../common/BaseWorker';
import { BotStatusType, BotWorkerStatusType, LocalWorkerAccountType, WorkerEventActions } from '../../../types';

export default class BotWorkerCustom extends BaseWorker {
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

  async handleCallBackButton({ path,messageId }:{path:string,messageId:number}) {
    await super.handleCallBackButton({path})
  }

  handleEvent(action:WorkerEventActions, payload:any) {
    super.handleEvent(action, payload)

    switch (action) {
      case WorkerEventActions.Worker_AskMsg:
        console.log("[Worker_AskMsg]", JSON.stringify(payload));
        break;
    }
  }
}
