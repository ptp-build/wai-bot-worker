import {kv, ENV, storage} from '../../env';
import Account from '../Account';
import {PbUser} from "../../../lib/ptp/protobuf/PTPCommon";
import {Pdu} from "../../../lib/ptp/protobuf/BaseMsg";
import {currentTs1000} from "../utils/utils";

export async function genUserId() {
  let value = await kv.get('USER_INCR', true);
  if (!value) {
    value = parseInt(ENV.SERVER_USER_ID_START);
  } else {
    value = parseInt(value) + 1;
  }
  await kv.put('USER_INCR', value.toString());
  return value.toString();
}

export type AuthSessionType = {
  authUserId: string;
  ts: number;
  address: string;
  clientId: number;
  chatId?: string;
};

export async function getSessionInfoFromSign(token: string) {
  let chatId;
  const res = token.split('_');
  let sign = res[0];
  let ts = parseInt(res[1] || currentTs1000().toString()) ;
  let clientId = parseInt(res[3] || "0");
  if(token.startsWith("s_")){
    chatId = parseInt(res[3])
    sign = res[1];
    ts = chatId
    clientId = 0;
  }

  const account = new Account(1);
  const { address } = account.recoverAddressAndPubKey(Buffer.from(sign, 'hex'), ts.toString());
  if(token.startsWith("s_")){
    ts =  currentTs1000()
  }
  if (!address) {
    return;
  }
  Account.setServerKv(kv);
  let authUserId = await account.getUidFromCacheByAddress(address);
  if (!authUserId) {
    authUserId = await genUserId();
    await account.saveUidFromCacheByAddress(address, authUserId);
  }
  console.log("====>>",token,{ authUserId, ts, address, clientId,chatId })
  return { authUserId, ts, address, clientId,chatId:chatId ? chatId.toString() : undefined };
}

export class User{
  private userId: string;
  constructor(userId:string) {
    this.userId = userId
  }

  static async getBotOwnerUserID(userId:string){
    return await kv.get(`W_B_U_R_${userId}`);
  }

  static async setBotOwnerUserID(userId:string,ownerUserId:string){
    return await kv.put(`W_B_U_R_${userId}`,ownerUserId);
  }

  static async getUserBuffFromKv(userId:string){
    const res = await storage.get(`wai/users/${userId}`);
    return res ? Buffer.from(res) : null
  }

  static async getUserInfoFromKv(userId:string){
    const buf = await User.getUserBuffFromKv(userId)
    return buf ? PbUser.parseMsg(new Pdu(buf)) : null
  }

  static async enableBotIsPublic(chatId:string,enable: boolean) {
    await kv.put("W_U_B_PUB_"+chatId,enable? '1': "0")
  }

  static async getBotIsPublic(botId:string) {
    const str = await kv.get("W_U_B_PUB_"+botId)
    return str === "1";
  }
}
