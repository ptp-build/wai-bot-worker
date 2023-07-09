import BaseWorker from '../../../sdk/botWorker/BaseWorker';
import { BotStatusType, LocalWorkerAccountType, WorkerEventActions } from '../../../sdk/types';

const {$} = window

export default class BotWorkerCustom extends BaseWorker {
  constructor(workerAccount:LocalWorkerAccountType) {
    super(workerAccount);
    this.init();
  }
  init() {
    this.loop().catch(console.error)
  }

  async loop(){
    this.reportStatus(BotStatusType.ONLINE)
    setTimeout(async ()=>{
      await this.loop()
    },1000)
  }

  async handleCallBackButton(payload:{path:string,messageId:number,chatId:string}) {
    await super.handleCallBackButton(payload)
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
