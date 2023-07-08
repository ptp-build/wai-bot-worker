export default class StorageHelper {
  private readonly botId:string;
  constructor(botId:string) {
    this.botId = botId
  }
  getBotId(){
    return this.botId
  }
  getKey(key:string){
    return `wai_${key}_${this.botId}`
  }
  put(key:string,value:any){
    localStorage.setItem(this.getKey(key),JSON.stringify([value]))
  }
  get(key:string){
    const str = localStorage.getItem(this.getKey(key))
    if(!str){
      return null
    }else{
      return JSON.parse(str)[0]
    }
  }
  delete(key:string){
    localStorage.removeItem(this.getKey(key))
  }
}
