import KvCache from '../../worker/services/kv/KvCache';
import DbStorage from '../../worker/services/db/DbStorage';
import WorkerGroupTable from '../../worker/models/rdms/WorkerGroupTable';

export default class WorkerGroup{
  private readonly chatId: string;
  constructor(chatId:string) {
    this.chatId = chatId;
  }
  async get():Promise<any> {
    if (!DbStorage.getInstance().getHandler()) {
      return await KvCache.getInstance().get("worker_group_" + this.chatId)
    } else{
      const row =  await new WorkerGroupTable().getRow(this.chatId)
      if(row && row.data){
        return row.data
      }else {
        return null
      }
    }
  }
  async update(account:any){
    if (!DbStorage.getInstance().getHandler()) {
      await KvCache.getInstance()
        .put("worker_group_" + this.chatId,account)
    }else{
      await new WorkerGroupTable().save({
        chatId:this.chatId,
        data:account
      })
    }
  }

  static async addList(chatId:string){
    if(!DbStorage.getInstance().getHandler()){
      const botList = await WorkerGroup.getBotList()
      if(!botList.includes(chatId)){
        botList.push(chatId)
        await KvCache.getInstance().put("worker_groups_list",botList)
      }
    }
  }

  static async deleteBotList(chatId:string){
    const botList = await WorkerGroup.getBotList()
    if(botList.includes(chatId)){
      if (!DbStorage.getInstance().getHandler()) {
        return await KvCache.getInstance().put("worker_groups_list",botList.filter((id:string)=>id !== chatId))
      }else{
        return await new WorkerGroupTable().deleteRow(chatId)
      }
    }
  }

  static async getBotList(){
    if (!DbStorage.getInstance().getHandler()) {
      return await KvCache.getInstance().get("worker_groups_list") || []
    }else{
      const rows = await new WorkerGroupTable().query("select * from wai_worker_group where isDeleted = false")
      return rows.map(({chatId}:any)=>{
        return chatId!.toString()
      })
    }
  }
}
