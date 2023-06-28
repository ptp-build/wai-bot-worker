let currentInstance:MsgConnChatGptBotWorkerManager;

export enum MsgConnChatGptBotWorkerStatus {
  OFFLINE = 1,
  READY = 2,
  BUSY = 3,
}


export type MsgConnChatGptBotWorker = {
  msgConnId:string,
  botId:string,
  ownerUid:string,
  status:MsgConnChatGptBotWorkerStatus
}

export default class MsgConnChatGptBotWorkerManager {
  private statusMap: Map<string, MsgConnChatGptBotWorker>;

  static getInstance(){
    if(!currentInstance){
      currentInstance = new MsgConnChatGptBotWorkerManager()
    }
    return currentInstance
  }

  constructor() {
    this.statusMap = new Map();
  }

  getStatusMap() {
    return this.statusMap
  }

  setStatus(botId:string,ownerUid:string,msgConnId:string,status:MsgConnChatGptBotWorkerStatus){
    this.statusMap.set(botId,{
      ownerUid,
      msgConnId,
      botId,
      status
    })
  }
  setBotStatus(msgConnId:string,status:MsgConnChatGptBotWorkerStatus){
    this.statusMap.forEach((worker,botId)=>{
      if(worker.msgConnId === msgConnId){
        this.statusMap.set(worker.botId,{
          ...worker,
          status
        })
      }
    })
  }

  getStatus(botId:string){
    return this.statusMap.get(botId)?.status
  }

  remove(botId:string){
    this.statusMap.delete(botId)
  }

  getRandomReadyWorker(): MsgConnChatGptBotWorker | null {
    const readyWorkers = Array.from(this.statusMap.values()).filter(worker => worker.status === MsgConnChatGptBotWorkerStatus.READY);
    if (readyWorkers.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * readyWorkers.length);
    return readyWorkers[randomIndex];
  }
}
