import StorageHelper from '../../../sdk/helper/StorageHelper';

export default class TelegramStorage extends StorageHelper{
  constructor(botId:string) {
    super(botId)
  }
  getChatIdsForCheckMessage():string[]{
    return this.get("ChatIdsForCheckMessage") || []
  }
  saveChatIdsForCheckMessage(chatIds:string[]){
    return this.put("ChatIdsForCheckMessage",chatIds)
  }
}
