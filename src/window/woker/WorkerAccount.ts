import KvCache from '../../worker/services/kv/KvCache';
import { LocalWorkerAccountType } from '../../sdk/types';
import WorkerAccountTable, { WorkerAccountTableType } from '../../worker/models/rdms/WorkerAccountTable';
import DbStorage from '../../worker/services/db/DbStorage';
import { MasterBotId } from '../../sdk/setting';

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

  async getWorkersAccount():Promise<LocalWorkerAccountType | Record<string, any>> {
    if (!DbStorage.getInstance().getHandler()) {
      return await KvCache.getInstance()
        .get("worker_account_" + this.botId) || {}
    }else{
      const row =  await new WorkerAccountTable().getRow(Number(this.botId))
      if(row && row.data){
        return row.data
      }else {
        return {}
      }
    }
  }
  async updateWorkersAccount(account:LocalWorkerAccountType){
    console.log("[updateWorkersAccount]",account)
    if (!DbStorage.getInstance().getHandler()) {
      await KvCache.getInstance()
        .put("worker_account_" + this.botId,account)
    }else{
      await new WorkerAccountTable().save({
        botId:Number(this.botId),
        data:account
      })
    }
  }
  static getMasterWorkerAccount(){
    return new WorkerAccount(MasterBotId).getWorkersAccount()
  }

  static async addBotList(botId:string){
    if(!DbStorage.getInstance().getHandler()){
      const botList = await WorkerAccount.getBotList()
      if(!botList.includes(botId)){
        botList.push(botId)
        await KvCache.getInstance().put("worker_accounts_list",botList)
      }
    }
  }

  static async deleteBotList(botId:string){
    const botList = await WorkerAccount.getBotList()
    if(botList.includes(botId)){
      if (!DbStorage.getInstance().getHandler()) {
        return await KvCache.getInstance().put("worker_accounts_list",botList.filter((id:string)=>id !== botId))
      }else{
        return await new WorkerAccountTable().deleteRow(Number(botId))
      }
    }
  }

  static async getBotList(){
    if (!DbStorage.getInstance().getHandler()) {
      return await KvCache.getInstance().get("worker_accounts_list") || []
    }else{
      const rows = await new WorkerAccountTable().query("select * from wai_worker_account where isDeleted = false")
      return rows.map(({botId}:WorkerAccountTableType)=>{
        return botId!.toString()
      })
    }
  }
}
