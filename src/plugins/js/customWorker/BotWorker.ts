import BaseWorker from "../common/BaseWorker";
import {
  BotStatusType,
  BotWorkerStatusType,
  ChatGptAiTaskType,
  LocalWorkerAccountType,
  WorkerCallbackButtonAction,
  WorkerEventActions,
  WorkerEvents
} from "../../../types";
import {sendActionToWorkerWindow} from "../common/helper";

let i = 0;
export default class BotWorker extends BaseWorker {
  private tasks:Map<number,ChatGptAiTaskType>
  private statusBot:BotStatusType;
  private statusBotWorker:BotWorkerStatusType;
  constructor(workerAccount:LocalWorkerAccountType) {
    super(workerAccount);
    this.tasks = new Map<number, ChatGptAiTaskType>();
    this.statusBot = BotStatusType.STARTED;
    this.statusBotWorker = BotWorkerStatusType.WaitToReady
    this.init();
  }
  init() {
    console.log("[BotWorker INIT]",this.botId)
    setInterval(async ()=>{
      await this.loop()
    },1000)
  }
  async loop(){
    this.statusBot = BotStatusType.ONLINE;
    this.statusBotWorker = BotWorkerStatusType.Ready
    this.reportStatus(this.statusBot,this.statusBotWorker)
    this.getWorkersStatus()
  }
  async handleCallBackButton({ path }:{path:string}) {
    switch (path) {
      case WorkerCallbackButtonAction.Worker_locationReload:
        await sendActionToWorkerWindow(this.botId,WorkerEventActions.Worker_Reload, {})
        break;
    }
  }

  handleEvent(action:WorkerEventActions, payload:any) {
    switch (action) {

      case WorkerEventActions.Worker_GetWorkerStatus:
        this.reportStatus(this.statusBot,this.statusBotWorker)
        break;

      case WorkerEventActions.Worker_CallBackButton:
        console.log("[Worker_CallBackButton]", JSON.stringify(payload));
        this.handleCallBackButton(payload).catch(console.error);
        break;
    }
  }

  addEvents() {
    window.electron?.on(WorkerEvents.Worker_Chat_Msg, async (botId:string, action:WorkerEventActions, payload:any) => {
      await this.handleEvent(action, payload);
    });
    return this;
  }
}
