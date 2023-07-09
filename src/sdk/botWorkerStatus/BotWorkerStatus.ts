import { BotStatusType } from '../types';

export const __StatusBot:Record<string, BotStatusType> = {}

export default class BotWorkerStatus {
  static getIsReadyByBotId(botId:string){
    return __StatusBot[botId] && __StatusBot[botId] === BotStatusType.ONLINE
  }
  static updateAll(payload:any){
    Object.assign(__StatusBot,payload.statusBot)
  }
  static update(payload:{botId:string,statusBot:BotStatusType}){
    __StatusBot[payload.botId] = payload.statusBot
  }
  static get(botId:string){
    return {
      statusBot:__StatusBot[botId],
    }
  }
  static getAllBotWorkersStatus(){
    return {
      statusBot:__StatusBot,
    }
  }
}
