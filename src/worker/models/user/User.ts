import KvCache from "../../services/kv/KvCache";
import BigStorage from "../../services/storage/BigStorage";

export class User{
  private userId: string;
  constructor(userId:string) {
    this.userId = userId
  }

  static async genUserId() {
    let value = await KvCache.getInstance().get('USER_INCR');
    if (!value) {
      value = 20000;
    } else {
      value = parseInt(value) + 1;
    }
    await KvCache.getInstance().put('USER_INCR', value.toString());
    return value.toString();
  }
  static async getBotOwnerUserID(userId:string){
    return await KvCache.getInstance().get(`W_B_U_R_${userId}`);
  }

  static async setBotOwnerUserID(userId:string,ownerUserId:string){
    return await KvCache.getInstance().put(`W_B_U_R_${userId}`,ownerUserId);
  }

  static async getUserBuffFromKv(userId:string){
    const res = await BigStorage.getInstance().get(`wai/users/${userId}`);
    return res ? Buffer.from(res) : null
  }

  static async enableBotIsPublic(chatId:string,enable: boolean) {
    await KvCache.getInstance().put("W_U_B_PUB_"+chatId,enable? '1': "0")
  }

  static async getBotIsPublic(botId:string) {
    const str = await KvCache.getInstance().get("W_U_B_PUB_"+botId)
    return str === "1";
  }
}
