import BaseKv from './BaseKv';
import KvTable from "../../models/mysql/KvTable";

export default class MySqlKv extends BaseKv{
  private db: any;
  init(db: any) {
    this.db = new KvTable().setDb(db);
    return this
  }

  async get(key: string) {
    try {
      console.debug('[kv get]',key);
      const res = await this.db.getRow(key);
      if(res && res.value){
        const value  = res.value[0]
        console.debug('[kv get]',key,value);
        return value
      }else{
        return null
      }
    }catch (e){
      return null
    }
  }

  async put(key: string, value: any) {
    try {
      console.debug('[kv put]',key,value);
      return await this.db.saveRow({
        name: key,
        value:[value]
      })
    }catch (e){
      return false
    }
  }

  async delete(key: string) {
    console.debug('[kv delete]',key);
    try {
      return await this.db.deleteRow(key)
    }catch (e){
      return false
    }
  }
}
