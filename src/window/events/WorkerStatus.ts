import WindowEventsHandler from './WindowEventsHandler';
import { BotStatusType, LocalWorkerAccountType, MasterEventActions } from '../../sdk/types';
import WorkerAccount from '../woker/WorkerAccount';

export default class WorkerStatus{
  private botId: string;
  constructor(botId:string) {
    this.botId = botId
  }
  async sendOffline(){
    const workerAccount = await new WorkerAccount(this.botId).get() as LocalWorkerAccountType
    if(workerAccount && ["chatGpt", 'taskWorker', 'custom' ].includes(workerAccount.type)){
      return await WindowEventsHandler.sendEventToMasterChat(MasterEventActions.UpdateWorkerStatus, {
        statusBot: BotStatusType.OFFLINE,
        botId:this.botId
      })
    }
  }
}
