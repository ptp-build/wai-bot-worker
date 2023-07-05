import Bridge from './Bridge';
import { WorkerEventActions } from '../types';

export default class BridgeWorkerWindow extends Bridge{
  constructor(botId?:string) {
    super(botId);
  }
  activeWindow(botId:string){
    return this.invokeWorkerWindowAction(WorkerEventActions.Worker_ActiveWindow,{botId})
  }

  notifyWorkerStatus(botId:string,statusBot:any,statusBotWorker:any){
    return this.invokeWorkerWindowAction(WorkerEventActions.Worker_NotifyWorkerStatus,{
      botId,
      statusBot,
      statusBotWorker
    })
  }
  showDevTools(){
    return this.invokeWorkerWindowAction(WorkerEventActions.Worker_ShowDevTools)
  }
  goBack(){
    return this.invokeWorkerWindowAction(WorkerEventActions.Worker_GoBack)
  }
  reload(){
    return this.invokeWorkerWindowAction(WorkerEventActions.Worker_Reload)
  }

  taskAiMsg(payload:any){
    return this.invokeWorkerWindowAction(WorkerEventActions.Worker_TaskAiMsg, payload);
  }
  loadUrl(payload:any){
    return this.invokeWorkerWindowAction(WorkerEventActions.Worker_LoadUrl, payload);
  }

  sendChatMsgToWorker(payload:any){
    return this.invokeWorkerWindowAction(WorkerEventActions.Worker_ChatMsg, payload);
  }

  getWorkerStatus(payload:any){
    return this.invokeWorkerWindowAction(WorkerEventActions.Worker_GetWorkerStatus, payload);
  }
  updateWorkerAccount(payload:any){
    return this.invokeWorkerWindowAction(WorkerEventActions.Worker_UpdateWorkerAccount, payload);
  }
}
