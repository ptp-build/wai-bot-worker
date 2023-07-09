import KvCache from '../../worker/services/kv/KvCache';
import { LocalWorkerAccountType, LocalWorkerType } from '../../sdk/types';
import WorkerAccountTable, { WorkerAccountTableType } from '../../worker/models/rdms/WorkerAccountTable';
import DbStorage from '../../worker/services/db/DbStorage';
import { MasterBotId } from '../../sdk/setting';
import MsgTable from '../../worker/models/rdms/MsgTable';

const cacheAccounts =  new Map<string, LocalWorkerAccountType | Record<string, any>>();

export default class WorkerAccount{
  private readonly botId: string;
  constructor(botId:string) {
    this.botId = botId;
  }

  async get():Promise<LocalWorkerAccountType | Record<string, any>> {
    let account;
    if(cacheAccounts.has(this.botId)){
      account = cacheAccounts.get(this.botId)!
    }else{
      if (!DbStorage.getInstance().getHandler()) {
        account = await KvCache.getInstance()
          .get("worker_account_" + this.botId) || {}
        cacheAccounts.set(this.botId,account)
        return account
      }else{
        const row =  await new WorkerAccountTable().getRow(Number(this.botId))
        if(row && row.data){
          account = row.data
          cacheAccounts.set(this.botId,account)
        }else {
          account = {}
          cacheAccounts.set(this.botId,account)
        }
      }
    }
    return account
  }
  async update(account:LocalWorkerAccountType){
    if (!DbStorage.getInstance().getHandler()) {
      await KvCache.getInstance()
        .put("worker_account_" + this.botId,account)
    }else{
      await new WorkerAccountTable().save({
        botId:Number(this.botId),
        data:account
      })
    }
    cacheAccounts.set(this.botId,account)
  }
  static getMasterWorkerAccount(){
    return new WorkerAccount(MasterBotId).get()
  }

  static async addBotList(botId:string){
    if(!DbStorage.getInstance().getHandler()){
      const botList = await WorkerAccount.getBotList()
      if(!botList.includes(botId)){
        botList.push(botId)
        await KvCache.getInstance().put("worker_accounts_list",botList)
      }
    }else{
      await new MsgTable().createTable(botId)
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

  static async getAccounts():Promise<LocalWorkerAccountType[]>{
    const botList = await WorkerAccount.getBotList()
    const accounts:LocalWorkerAccountType[] = []
    for (let i = 0; i < botList.length; i++) {
      accounts.push(await new WorkerAccount(botList[i]).get() as LocalWorkerAccountType)
    }
    return accounts
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
  static getDefaultName(botId:string,type:LocalWorkerType){
    let username = "";
    let name = "";
    switch (type){
      case 'coding':
        username = `Coding_${botId}_bot`;
        name = `Coding #${botId}`
        break
      case 'chatGpt':
        username = `ChatGpt_${botId}_bot`;
        name = `ChatGpt #${botId}`
        break
      case 'custom':
        username = `worker_${botId}_bot`;
        name = `CustomWorker #${botId}`
        break
      default:
        username = `${botId}_bot`;
        name = `Bot #${botId}`
    }
    return {
      name,username
    }
  }
}
