import BaseWorker from "../common/BaseWorker";
import {
  BotStatusType,
  BotWorkerStatusType,
  CallbackButtonAction,
  ChatGptAiTaskType,
  LocalWorkerAccountType,
  RenderActions,
  WorkerCallbackButtonAction,
  WorkerEventActions,
  WorkerEvents
} from "../../../types";
import {JSON_HEADERS} from "../../../worker/setting";
import {generateUniqueId} from "../../../worker/utils/utils";
import {currentTs1000} from "../../../utils/utils";
import {sendActionToWorkerWindow} from "../common/helper";
import MsgHelper from "../../../masterChat/MsgHelper";

let i = 0;
const token = generateUniqueId();
export default class BotWorker extends BaseWorker {
  private tasks:Map<number,ChatGptAiTaskType>
  private statusBot?:BotStatusType;
  private statusBotWorker?:BotWorkerStatusType;
  constructor(workerAccount:LocalWorkerAccountType) {
    super(workerAccount);
    this.tasks = new Map<number, ChatGptAiTaskType>();
    this.init();
  }
  init() {
    console.log("[BotWorker INIT]",this.botId)
    this.statusBot = BotStatusType.STARTED;
    this.statusBotWorker = BotWorkerStatusType.WaitToReady

    if(!this.getWorkerAccount().taskWorkerUri){
      this.statusBot = BotStatusType.TaskWorkerNoApi;
      this.reportStatus(this.statusBot,this.statusBotWorker)
    }else{
      this.fetchTask().catch(console.error)
    }
  }
  async fetchTask(){
    this.reportStatus(this.statusBot!,this.statusBotWorker!)
    this.getWorkersStatus()
    try {
      // @ts-ignore
      const {tasks}:{task:any} = await this.request(RenderActions.GetAiAskTask,{})
      if(tasks){
        for (let j = 0; j < tasks.length; j++) {
          const task = tasks[j]
          this.tasks.set(task.id,task)
          console.debug("fetchTask ",i++,JSON.stringify(task))
          await this.reportTask("hi",task.id,true)
          // await this.askMessageByTaskWorker(task.text,task.taskId);
        }
      }
      this.statusBot = BotStatusType.ONLINE;
      this.statusBotWorker = BotWorkerStatusType.Ready
    }catch (e){
      this.statusBot = BotStatusType.TaskWorkerApiError;
      this.statusBotWorker = BotWorkerStatusType.WaitToReady
      console.error(e)
    }
    setTimeout(async () => await this.fetchTask(), 5000);
  }

  async reportTask(text:string,taskId:number,isDone?:boolean){
    const task = this.tasks.get(taskId)
    if(task){
      // await this.request(RenderActions.ReportAiAskTask,{
      //   id:task.id,
      //   userId:task.userId,
      //   chatId:task.chatId,
      //   msgId:task.msgId,
      //   text,
      //   isDone,
      //   msgDate:currentTs1000()/1000
      // })
    }
  }
  async request(action:string,payload:any){
    const url = this.getWorkerAccount().taskWorkerUri + "?action="+action

    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...JSON_HEADERS,
        "Authorization":"Bearer "+token
      },
      body: JSON.stringify({
        action,
        payload
      })
    })
    return await res.json()
  }

  async loop(){
    this.reportStatus(this.statusBot!,this.statusBotWorker!)
    this.getWorkersStatus()
  }
  async handleCallBackButton({ path }:{path:string}) {
    const statusBots = [
      BotStatusType.TaskWorkerNoApi,
      BotStatusType.TaskWorkerApiError,
    ]
    const action = path.replace("Worker_","")
    for (let i = 0; i < statusBots.length; i++) {
      switch (action) {
        case BotStatusType.TaskWorkerApiError:
          await sendActionToWorkerWindow(this.botId,WorkerEventActions.Worker_Reload, {})
          break
        case BotStatusType.TaskWorkerNoApi:
          this.replyMessageWithCancel("Setup Task Work api",[
            [
              MsgHelper.buildCallBackAction("Click Me!",CallbackButtonAction.Local_setupTaskUri)
            ]
          ])
          return
      }
    }
    switch (path) {
      case WorkerCallbackButtonAction.Worker_locationReload:
        await sendActionToWorkerWindow(this.botId,WorkerEventActions.Worker_Reload, {})
        break;
    }
  }

  handleEvent(action:WorkerEventActions, payload:any) {
    switch (action) {
      case WorkerEventActions.Worker_TaskAiMsg:
        this.reportTask(payload.updateMessage.text,payload.taskId,payload.isDone)
        break;
      case WorkerEventActions.Worker_GetWorkerStatus:
        this.reportStatus(this.statusBot!,this.statusBotWorker!)
        break;
      case WorkerEventActions.Worker_NotifyWorkerStatus:
        // console.log("[Worker_NotifyWorkerStatus]", JSON.stringify(payload));
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

