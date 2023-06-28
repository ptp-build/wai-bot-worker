import BaseDb from "./BaseDb";

let __instance:DbStorage|null = null

export default class DbStorage{
  private handler?: BaseDb;
  constructor() {}
  static getInstance(){
    if(!__instance){
      __instance = new DbStorage();
    }
    return __instance
  }
  getHandler() {
    return this.handler
  }
  setHandler(handler: BaseDb) {
    this.handler = handler;
    return this
  }

  async query(...args: any[]) {
    // console.log("[DbStorage query]",args)
    // @ts-ignore
    return await this.handler!.query.apply(this.handler, args);
  }
  async execute(...args: any[]) {
    // console.log("[execute]",args)
    // @ts-ignore
    return await this.handler!.execute.apply(this.handler, args);
  }
}
