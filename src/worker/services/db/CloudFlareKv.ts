import BaseKv from './BaseKv';

export default class CloudFlareKv extends BaseKv{
  private db: any;
  static cache: Record<string, any> = {};
  init(db: any) {
    this.db = db;
  }

  async get(key: string, force?: boolean) {
    force = true;
    if (!force && CloudFlareKv.cache[key] !== undefined) {
      return CloudFlareKv.cache[key];
    } else {
      console.debug('[kv get]', key);
      try {
        CloudFlareKv.cache[key] = await this.db.get(key);
        return CloudFlareKv.cache[key];
      }catch (e){
        return null
      }
    }
  }

  async put(key: string, value: any) {
    console.debug('[kv put]',key);
    CloudFlareKv.cache[key] = value;
    try {
      this.db.put(key, value);
      return true
    }catch (e){
      return false
    }
  }

  async delete(key: string) {
    console.debug('[kv delete]',key);
    try {
      this.db.delete(key);
      delete CloudFlareKv.cache[key];
      return true
    }catch (e){
      return false
    }
  }
}
