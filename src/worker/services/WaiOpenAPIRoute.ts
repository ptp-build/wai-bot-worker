import BaseOpenAPIRoute from "./BaseOpenAPIRoute";
import ServerSession from "./ServerSession";
import UserTable from "../models/rdms/UserTable";

export default class WaiOpenAPIRoute extends BaseOpenAPIRoute {
  private token: string | undefined;
  private session: ServerSession | undefined;
  async sessionStart(request:Request){
    await this.checkAuth(request)

  }
  getSession(){
    return this.session
  }
  getToken() {
    return this.token;
  }
  async checkAuth(request: Request) {
    const auth = request.headers.get('Authorization');
    if (!auth) {
      return WaiOpenAPIRoute.responseError('Authorization invalid', 400);
    }
    this.token = request.headers.get('Authorization')!.replace("Bearer ","");

    const user = await new UserTable().getRowByToken(this.token)
    this.session = new ServerSession(request)

    if(!user){
      const userId = await new UserTable().save({
        token:this.token,
        address:this.token
      })
      if(!userId){
        return WaiOpenAPIRoute.responseError('System Error', 500);
      }else{
        this.session.setUserId(userId)
      }
    }else{
      this.session.setUserId(user.id!)
    }
    return false;
  }
}
