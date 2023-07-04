import { BotStatusType, BotWorkerStatusType } from '../types';

export const __StatusBotCenter:Record<string, BotStatusType> = {}
export const __StatusBotWorkerCenter:Record<string, BotWorkerStatusType> = {}

export default class WindowBotWorkerStatus {
  static getIsReadyByBotId(botId:string){
    return __StatusBotWorkerCenter[botId] && __StatusBotWorkerCenter[botId] === BotWorkerStatusType.Ready
  }
  static updateAll(payload:any){
    Object.assign(__StatusBotCenter,payload.statusBot)
    Object.assign(__StatusBotWorkerCenter,payload.statusBotWorker)
  }
  static update(payload:{botId:string,statusBot:BotStatusType,statusBotWorker:BotWorkerStatusType}){
    __StatusBotCenter[payload.botId] = payload.statusBot
    __StatusBotWorkerCenter[payload.botId] = payload.statusBotWorker
    console.log("[WindowBotWorkerStatus]",{__StatusBotCenter,__StatusBotWorkerCenter})
  }
  static get(botId:string){
    return {
      statusBot:__StatusBotCenter[botId],
      statusBotWorker:__StatusBotWorkerCenter[botId]
    }
  }
  static getAllBotWorkersStatus(){
    return {
      statusBot:__StatusBotCenter,
      statusBotWorker:__StatusBotWorkerCenter
    }
  }
}
