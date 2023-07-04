import WindowEventsHandler from './WindowEventsHandler';
import { BotStatusType, BotWorkerStatusType, LocalWorkerAccountType, MasterEventActions } from '../../types';
import WorkerAccount from '../woker/WorkerAccount';

export default class WorkerStatus{
  private botId: string;
  constructor(botId:string) {
    this.botId = botId
  }
  async sendOffline(){
    const workerAccount = await new WorkerAccount(this.botId).getWorkersAccount() as LocalWorkerAccountType
    if(workerAccount && ["chatGpt", 'taskWorker', 'custom' ].includes(workerAccount.type)){
      return await WindowEventsHandler.sendEventToMasterChat(MasterEventActions.UpdateWorkerStatus, {
        statusBot: BotStatusType.OFFLINE,
        statusBotWorker: BotWorkerStatusType.WaitToReady,
        botId:this.botId
      })
    }
  }
}
