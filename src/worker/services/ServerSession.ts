export default class ServerSession{
  private request: Request;
  private userId?: number;
  private accountAddress?: string;
  constructor(request:Request) {
    this.request = request
  }
  getRequest(){
    return this.request
  }

  setAccountAddress(accountAddress:string){
    this.accountAddress = accountAddress
    return this;
  }

  setUserId(userId:number){
    this.userId = userId
    return this;
  }

  getAccountAddress(){
    return this.accountAddress
  }
  getUserId(){
    return this.userId
  }
}
