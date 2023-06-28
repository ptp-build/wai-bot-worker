import KvCache from "../../worker/services/kv/KvCache";
import {LocalWorkerAccountType} from "../../types";
import {UserIdFirstBot} from "../../setting";

export default class WorkerAccount{
  private botId: string;
  constructor(botId:string) {
    this.botId = botId;
  }
  async getProxy(){
    const account = await this.getWorkersAccount()
    return account ? account.proxy : ""
  }
  async getChatGptAuth(){
    const account = await this.getWorkersAccount()
    return account ? account.chatGptAuth : ""
  }
  async getWorkersAccount():Promise<LocalWorkerAccountType | undefined> {
    return await KvCache.getInstance()
      .get("worker_account_" + this.botId)
  }
  static getMasterWorkerAccount(){
    return new WorkerAccount(UserIdFirstBot).getWorkersAccount()
  }
  async updateWorkersAccount(account:Partial<LocalWorkerAccountType>){
    await KvCache.getInstance()
      .put("worker_account_" + this.botId,account)
  }

  static async addBotList(botId:string){
    const botList = await WorkerAccount.getBotList()
    if(!botList.includes(botId)){
      botList.push(botId)
      await KvCache.getInstance().put("worker_accounts_list",botList)
    }
  }

  static async deleteBotList(botId:string){
    const botList = await WorkerAccount.getBotList()
    if(botList.includes(botId)){
      await KvCache.getInstance().put("worker_accounts_list",botList.filter((id:string)=>id !== botId))
    }
  }

  static async getBotList(){
    return await KvCache.getInstance().get("worker_accounts_list") || []
  }
}
