import BaseStorage from "./BaseStorage";

let __instance:BigStorage|null = null

export default class BigStorage {
  private handler?: BaseStorage;
  constructor() {}
  static getInstance(){
    if(!__instance){
      __instance = new BigStorage();
    }
    return __instance
  }
  setKvHandler(handler: BaseStorage) {
    this.handler = handler;
  }

  put(...args: any[]) {
    // @ts-ignore
    return this.handler!.put.apply(this.handler, args);
  }

  delete(...args: any[]) {
    // @ts-ignore
    return this.handler!.delete.apply(this.handler, args);
  }

  get(...args: any[]) {
    // @ts-ignore
    return this.handler!.get.apply(this.handler, args);
  }

  getFullPath(...args: any[]) {
    // @ts-ignore
    return this.handler!.getFullPath.apply(this.handler, args);
  }
}
