import BaseWorker from '../../../sdk/botWorker/BaseWorker';
import { sleep } from '../../../sdk/common/time';
import MsgHelper from '../../../sdk/helper/MsgHelper';
import { CallbackButtonAction, WorkerCallbackButtonAction } from '../../../sdk/types';
import TelegramHelper from '../../../sdk/helper/TelegramHelper';
import TelegramStorage from './TelegramStorage';
import FileHelper from '../../../sdk/helper/FileHelper';
import { encodeCallBackButtonPayload } from '../../../sdk/common/string';

export default class TelegramEvents {
  private worker: BaseWorker;
  private tgHelper: TelegramHelper;
  private readonly botId:string;
  private storage: TelegramStorage;
  constructor(worker:BaseWorker,tgHelper:TelegramHelper) {
    this.worker = worker
    this.botId = worker.botId
    this.tgHelper = tgHelper
    this.storage = new TelegramStorage(this.botId)
  }
  async checkMessages(){
    const chatId = "6351155193"
    const chatIds = this.storage.getChatIdsForCheckMessage();
    if(!chatIds.includes(chatId)){
      chatIds.push(chatId)
      this.storage.saveChatIdsForCheckMessage(chatIds);
    }
    for (let i = 0; i < chatIds.length; i++) {
      const chatId = chatIds[i]
      const lastMessage = this.tgHelper.selectChatLastMessage(chatId)
      if(lastMessage){
        const lastMessageIdLocal = this.storage.get("lastMessageId_"+chatId)
        const listMessageIds = this.tgHelper.selectChatMessageListIds(chatId)
        if((!lastMessageIdLocal || lastMessageIdLocal < lastMessage.id) && listMessageIds){
          listMessageIds.sort((a:number,b:number)=>a-b)
          for (let j = 0; j < listMessageIds.length; j++) {
            const msgId = listMessageIds[j]
            if(msgId > lastMessageIdLocal){
              debugger
              const message = this.tgHelper.selectChatMessage(chatId,msgId)
              console.log("[message]",message.id,message.content.text.text)
              this.storage.put("lastMessageId_"+chatId,msgId)
              await this.worker.replyMessageWithCancel(message.content)
            }
          }
        }
      }
    }
  }
  async searchChat(chatId:string){
    const inputEle = window.$("#telegram-search-input")
    const offset1 = inputEle.offset()
    await this.worker.sendClick(offset1)
    const chatInfo = this.tgHelper.selectChat(chatId)
    const currentChatId = this.tgHelper.getCurrentChatId()
    console.log("[openChat]",{chatId,currentChatId})
    if(window.$(".back-button").length > 0){
      await this.worker.sendClick(window.$(".back-button").offset())
      await sleep(100)
    }
    if(!chatId.includes("-")){
      const userInfo = this.tgHelper.selectUser(chatId)
      if(userInfo.usernames){
        console.log("[openChat] username",userInfo.usernames[0].username)
        inputEle.val("@"+userInfo.usernames[0].username)
      }else{
        inputEle.val(chatInfo.title)
      }
    }else{
      inputEle.val(chatInfo.title)
    }
    await this.worker.sendSpaceKeyboardEvent()
    await this.worker.sendBackSpaceKeyboardEvent()
    await sleep(200)
    try {
      const sections = await this.worker.waitForElement(".search-section .ListItem-button",30000)
      // @ts-ignore
      for (let i = 0; i < $(sections).length; i++) {
        // @ts-ignore
        const chatItem1 = $(sections)[i]
        if(chatItem1){
          // @ts-ignore
          const chatItem = $(chatItem1)
          let title = chatItem.find("h3").text();
          if(title.endsWith("...")){
            title = title.replace("...","")
          }
          if(chatInfo.title === title){
            await this.worker.sendClick(chatItem.offset())
            break
          }
        }
      }
    }catch (e){
      console.error(e)
    }
  }
  async openChat(chatId:string){
    return this.searchChat(chatId)
    let url,u
    if(location.href.includes("#")){
      u = location.href.split("#")[0]
    }else{
      u = location.href
    }
    if(u && u.includes("?")){
      u = u.split("?")[0] + "?v="+(+ (new Date()))
    }else{
      u = u + "?v="+(+ (new Date()))
    }
    url = u + "#" + chatId

    location.href = url
  }
  async getChats(currentPage:number = 0,messageId?:number){
    const chats = this.tgHelper.selectChats();
    const len = chats.length
    let buttons: any[] | undefined = []

    const maxLen = 5;
    if(len > maxLen){
      const nextPage = currentPage + 1
      const offset = currentPage * maxLen;
      const rows = chats.slice(offset, offset + maxLen)
      buttons = [
        ...rows.map((chat)=>{
          let {title} =  chat
          if(title.length > 15){
            title = title.substring(0,15)
          }
          return [
            MsgHelper.buildCallBackAction(`${title} #${chat.id}`,WorkerCallbackButtonAction.Worker_Tg_Open_Chat+"/"+chat.id)
          ]
        }),
      ]

      buttons.push([
        MsgHelper.buildButtonAction(
          `<<`,WorkerCallbackButtonAction.Worker_Tg_Chats+"/0",
          offset > 0 ? 'callback':"unsupported"
        ),
        MsgHelper.buildButtonAction(
          `<`,WorkerCallbackButtonAction.Worker_Tg_Chats+"/"+(nextPage - 2 < 0 ? 0 :nextPage - 2),
          offset > 0 ? 'callback':"unsupported"
        ),

        MsgHelper.buildButtonAction(
          `${currentPage + 1} / ${1 + Math.floor(len/maxLen)}`,"",
          "unsupported"
        ),
        MsgHelper.buildButtonAction(
          `>`,WorkerCallbackButtonAction.Worker_Tg_Chats+"/"+nextPage,
          offset < (len - maxLen) ? 'callback':"unsupported"
        ),
        MsgHelper.buildButtonAction(
          `>>`,
          WorkerCallbackButtonAction.Worker_Tg_Chats+"/"+Math.floor(len / 5),
          offset < (len - maxLen) ? 'callback':"unsupported"
        )
      ])
      if(messageId){
        buttons.push(MsgHelper.buildLocalCancel())
      }
    }
    if(!messageId){
      return this.worker.replyTextWithCancel("Chats",buttons)
    }else{
      return this.worker.replyUpdateMessage(messageId,this.worker.botId,{
        inlineButtons:buttons,
        msgId:messageId,
        entities:[],
        text:"Chats",
        chatId:this.worker.botId,
      })
    }
  }

  async getUserInfo(){
    const chatId = this.tgHelper.getCurrentChatId()
    if(chatId){
      const userInfo = this.tgHelper.selectUser(chatId)
      const userInfoFull = this.tgHelper.selectUserFullInfo(chatId)
      const chatInfo = this.tgHelper.selectChat(chatId)
      const chatInfoFull = this.tgHelper.selectChatFillInfo(chatId)
      await this.worker.replyJsonFile(`ChatInfo_${chatId}.json`,{userInfo,chatInfo,userInfoFull,chatInfoFull})
    }else{
      await this.worker.replyTextWithCancel("not chat open")
    }
  }
  async getLastMessage(){
    const chatId = this.tgHelper.getCurrentChatId()
    if(chatId){
      const chat = this.tgHelper.selectChat(chatId)
      const msg = chat.lastMessage
      let content = await this.tgHelper.saveMessageContent(chatId,this.worker.botId,msg);
      if(content){
        await this.worker.replyMessageWithCancel(content)
      }
      await this.worker.replyJsonFile(`Message_${chatId}_${msg.id}.json`,msg)

    }else{
      await this.worker.replyTextWithCancel("not chat open")
    }
  }

  async getCurrentChatId(){
    await this.worker.replyTextWithCancel("CurrentChatId:"+this.tgHelper.getCurrentChatId())
  }
  async debug(){

  }
}
