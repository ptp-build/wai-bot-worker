import KvCache from "../../worker/services/kv/KvCache";
import {ServerBotAccountType} from "../../sdk/types";
import BaseObject from "./BaseObject";
import ServerSession from "./ServerSession";

export default class ServerBotAccount extends BaseObject{
  private botId: string;
  private keyPrefix: string;
  constructor(session:ServerSession,botId:string) {
    super(session)
    this.botId = botId;
    this.keyPrefix = `SBA_${session.getAccountAddress()}`
  }

  async get():Promise<ServerBotAccountType | undefined> {
    return await KvCache.getInstance()
      .get(`${this.keyPrefix}_${this.botId}` )
  }
  async update(account:Partial<ServerBotAccountType>){
    await KvCache.getInstance()
      .put(`${this.keyPrefix}_${this.botId}`,account)
  }

  static async getBotList(accountAddress:string){
    const keyPrefixList = `SBA_List_${accountAddress}`
    return await KvCache.getInstance().get(`${keyPrefixList}`)
  }

  static async initWaiApp(accountAddress:string){
    const botIds = await ServerBotAccount.getBotList(accountAddress) || []
    const botAccounts = []
    for (let i = 0; i < botIds.length; i++) {
      botAccounts.push(await new ServerBotAccount(new ServerSession(new Request("")).setAccountAddress(accountAddress),botIds[i]).get())
    }
    return {
      botAccounts
    }
  }
}
