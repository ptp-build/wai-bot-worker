import BaseKv from './BaseKv';

export default class CloudFlareKv extends BaseKv{
  private db: any;
  init(db: any) {
    this.db = db;
    return this
  }

  async get(key: string) {
    try {
      console.debug('[kv get]',key);
      const res = await this.db.get(key);
      let value = null;
      if(res){
        const res1 = JSON.parse(res)
        if(res1.length > 0){
          value = res1[0]
        }
      }
      console.debug('[kv get]',key,value);
      return null
    }catch (e){
      return null
    }
  }

  async put(key: string, value: any) {
    try {
      console.debug('[kv put]',key,value);
      return await this.db.put(key, JSON.stringify([value]));
    }catch (e){
      return false
    }
  }

  async delete(key: string) {
    console.debug('[kv delete]',key);
    try {
      await this.db.delete(key);
      return true
    }catch (e){
      return false
    }
  }
}
