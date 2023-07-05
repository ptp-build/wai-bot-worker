import BaseWorker from '../common/BaseWorker';
import { BotStatusType, BotWorkerStatusType, LocalWorkerAccountType, WorkerEventActions } from '../../../types';
import { sleep } from '../common/helper';
const {$} = window
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
  async onMessage({text,chatId}:{text:string,chatId:string}){
    document.documentElement.scrollTop = 0
    await sleep(100)
    $("input[name=q]").val(text)
    await this.sendClick($("input[name=q]").offset())
    await this.sendSpaceKeyboardEvent()
    await sleep(100)
    await this.sendBackSpaceKeyboardEvent()
    await this.sendEnterKeyboardEvent()
    await sleep(10000)
    document.documentElement.scrollTop = 10000
  }
  async handleCallBackButton({ path,messageId }:{path:string,messageId:number}) {
    await super.handleCallBackButton({path})
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
