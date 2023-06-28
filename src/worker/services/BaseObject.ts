import ServerSession from "./ServerSession";

export default class BaseObject{
  private session: ServerSession;
  constructor(session:ServerSession) {
    this.session = session
  }
  getSession(){
    return this.session
  }
}
