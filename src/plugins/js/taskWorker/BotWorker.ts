import BaseWorker from '../../../sdk/botWorker/BaseWorker';
import {
  BotStatusType,
  ChatGptAiTaskType,
  LocalWorkerAccountType,
  RenderActions,
  WorkerCallbackButtonAction,
  WorkerEventActions,
  WorkerEvents,
} from '../../../sdk/types';
import { generateRandomString } from '../../../sdk/common/string';
import { JSON_HEADERS } from '../../../sdk/common/http';

let i = 0;
const token = generateRandomString(16);

export default class BotWorker extends BaseWorker {
  private tasks:Map<number,ChatGptAiTaskType>
  constructor(workerAccount:LocalWorkerAccountType) {
    super(workerAccount);
    this.tasks = new Map<number, ChatGptAiTaskType>();
    this.init();
  }
  init() {
    console.log("[BotWorker INIT]",this.botId)

    if(!this.getWorkerAccount().taskWorkerUri){
      this.reportStatus()
    }else{
      this.fetchTask().catch(console.error)
    }
  }
  async fetchTask(){
    this.reportStatus(this.statusBot)
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
      this.reportStatus(BotStatusType.ONLINE)
    }catch (e){
      this.reportStatus(BotStatusType.InvokeApiError)
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
    this.reportStatus()
    this.getWorkersStatus()
  }
  async handleCallBackButton({ path }:{path:string}) {
    // const statusBots = [
    //   BotStatusType.TaskWorkerNoApi,
    //   BotStatusType.TaskWorkerApiError,
    // ]
    // const action = path.replace("Worker_","")
    // for (let i = 0; i < statusBots.length; i++) {
    //   switch (action) {
    //     case BotStatusType.TaskWorkerApiError:
    //       await this.getBridgeWorkerWindow().reload()
    //       break
    //     case BotStatusType.TaskWorkerNoApi:
    //       this.replyTextWithCancel("Setup Task Work api",[
    //         [
    //           MsgHelper.buildCallBackAction("Click Me!",CallbackButtonAction.Local_setupTaskUri)
    //         ]
    //       ])
    //       return
    //   }
    // }
    switch (path) {
      case WorkerCallbackButtonAction.Worker_locationReload:
        await this.getBridgeWorkerWindow().reload()
        break;
    }
  }

  handleEvent(action:WorkerEventActions, payload:any) {
    switch (action) {
      case WorkerEventActions.Worker_TaskAiMsg:
        void this.reportTask(payload.updateMessage.text,payload.taskId,payload.isDone)
        break;
      case WorkerEventActions.Worker_GetWorkerStatus:
        this.reportStatus()
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

