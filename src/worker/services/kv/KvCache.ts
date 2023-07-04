import BaseKv from "./BaseKv";

let __instance:KvCache|null = null

export default class KvCache{
  private handler?: BaseKv;
  constructor() {}
  static getInstance(){
    if(!__instance){
      __instance = new KvCache();
    }
    return __instance
  }
  setKvHandler(handler: BaseKv) {
    this.handler = handler;
  }

  getKvHandler() {
    return this.handler
  }

  async put(key: string, value: any) {
    return await this.handler!.put(key,value)
  }

  async delete(key: string, ) {
    return await this.handler!.delete(key)
  }

  async get(key: string) {
    return await this.handler!.get(key)
  }
}
