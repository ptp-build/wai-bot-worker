import BaseWorker from '../../../sdk/botWorker/BaseWorker';
import {
  BotStatusType,
  LocalWorkerAccountType,
  WorkerCallbackButtonAction,
  WorkerEventActions,
} from '../../../sdk/types';
import { sleep } from '../../../sdk/common/time';


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
    this.reportStatus(BotStatusType.READY)
    setTimeout(async ()=>{
      await this.loop()
    },1000)
  }

  async handleCallBackButton(payload:{path:WorkerCallbackButtonAction,messageId:number,chatId:string}) {
    const {path} = payload
    switch (path){
      default:
        await super.handleCallBackButton(payload)
        break
    }
  }
  async onMessage({text,chatId}:{text:string,chatId:string}){
    console.log(text)
    if(text.startsWith("click(") && text.endsWith(")")){
      const [x,y] = text.replace("click(","").replace(")","").split(",").map(i=>i.trim()).map(Number)
      await this.click(x,y)
    } else {
      await this.sendKeyboardEvent('keyDown', "R",["command"])
      await sleep(1000);
      await this.sendKeyboardEvent('keyUp', "R",["command"])
    }
  }
  handleEvent(action:WorkerEventActions, payload:any) {
    super.handleEvent(action, payload)

    switch (action) {
      case WorkerEventActions.Worker_CallBackButton:
        this.handleCallBackButton(payload).catch(console.error);
        return;
      case WorkerEventActions.Worker_ChatMsg:
        console.log("[Worker_ChatMsg]", JSON.stringify(payload));
        void this.onMessage(payload)
        break;
    }

  }
}
