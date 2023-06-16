let currentInstance:MsgConnChatGptBotWorkerManager;

export enum MsgConnChatGptBotWorkerStatus {
  OFFLINE = 1,
  READY = 2,
  BUSY = 3,
}

export default class MsgConnChatGptBotWorkerManager {
  private statusMap: Map<string, MsgConnChatGptBotWorkerStatus>;

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
  setStatus(msgConnId:string,status:MsgConnChatGptBotWorkerStatus){
    this.statusMap.set(msgConnId,status)
  }

  getStatus(msgConnId:string){
    return this.statusMap.get(msgConnId)
  }
  remove(msgConnId:string){
    this.statusMap.delete(msgConnId)
  }
  getRandomReadyWorker() {
    const readyWorkers = Array.from(this.statusMap.entries()).filter(([_, status]) => status === MsgConnChatGptBotWorkerStatus.READY);

    if (readyWorkers.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * readyWorkers.length);
    return readyWorkers[randomIndex][0];
  }
}
