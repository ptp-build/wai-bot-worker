import BaseWorker from '../../sdk/botWorker/BaseWorker';

import {
  BotStatusType,
  BotWorkerStatusType,
  LocalWorkerAccountType,
  WorkerCallbackButtonAction,
  WorkerEventActions,
} from '../../sdk/types';
import MsgHelper from '../../sdk/helper/MsgHelper';
import TelegramHelper from '../../sdk/helper/TelegramHelper';
import { sleep } from '../../sdk/common/time';


export enum TgCallbackButtonAction {
  Worker_Tg_Debug = "Worker_Tg_Debug",
}


class TelegramWorker extends BaseWorker {
  private tgHelper: TelegramHelper;
  constructor(workerAccount:LocalWorkerAccountType) {
    super(workerAccount);
    this.tgHelper = new TelegramHelper()
    this.init();
  }
  init() {
    console.log("[BotWorker INIT]",this.botId)
    this.statusBot = BotStatusType.ONLINE
    this.loop().catch(console.error)
  }

  async loop(){
    const global = this.tgHelper.getGlobal();
    if(global){
      this.statusBotWorker = BotWorkerStatusType.Ready
    }
    this.reportStatus()
    setTimeout(async ()=>{
      await this.loop()
    },1000)
  }
  async searchChat(chatId:string){
    const inputEle = window.$("#telegram-search-input")
    const offset1 = inputEle.offset()
    await this.sendClick(offset1)
    const chatInfo = this.tgHelper.selectChat(chatId)
    const currentChatId = this.tgHelper.getCurrentChatId()
    console.log("[openChat]",{chatId,currentChatId})
    if(window.$(".back-button").length > 0){
      await this.sendClick(window.$(".back-button").offset())
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
    await this.sendSpaceKeyboardEvent()
    await this.sendBackSpaceKeyboardEvent()
    await sleep(200)
    try {
      const sections = await this.waitForElement(".search-section .ListItem-button",30000)
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
            await this.sendClick(chatItem.offset())
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
      return this.replyTextWithCancel("Chats",buttons)
    }else{
      return this.replyUpdateMessage(messageId,this.botId,{
        inlineButtons:buttons,
        msgId:messageId,
        entities:[],
        text:"Chats",
        chatId:this.botId,
      })
    }
  }
  async handleCallBackButton({ path,messageId }:{path:string,messageId:number}) {
    await super.handleCallBackButton({path})
    if(path.startsWith(WorkerCallbackButtonAction.Worker_Tg_Open_Chat+"/")){
      await this.openChat(path.replace(WorkerCallbackButtonAction.Worker_Tg_Open_Chat+"/",""))
    }
    if(path.startsWith(WorkerCallbackButtonAction.Worker_Tg_Chats+"/")){
      await this.getChats(Number(path.replace(WorkerCallbackButtonAction.Worker_Tg_Chats+"/","")),messageId)
    }
    switch (path){
      case WorkerCallbackButtonAction.Worker_Tg_Chats:
        return await this.getChats()
      case TgCallbackButtonAction.Worker_Tg_Debug:
        return await this.debug()
    }
  }
  async saveLastMessage(){
    const chatId = this.tgHelper.getCurrentChatId()
    if(chatId){
      const chat = this.tgHelper.selectChat(chatId)
      const msg = chat.lastMessage
      let content = await this.tgHelper.saveMessageContent(chatId,this.botId,msg);
      if(content){
        console.log(content)
        await this.replyMessageWithCancel(content)
      }else{
        await this.replyTextWithCancel("not found content")
      }
    }else{
      await this.replyTextWithCancel("chat is not open")
    }
  }
  async debug(){
    await this.saveLastMessage()
  }
  actions(){
    return [
      ...super.actions(),
      [
        MsgHelper.buildCallBackAction("All Chats",WorkerCallbackButtonAction.Worker_Tg_Chats)
      ],

      [
        MsgHelper.buildCallBackAction("Debug",TgCallbackButtonAction.Worker_Tg_Debug)
      ]
    ]
  }

  handleEvent(action:WorkerEventActions, payload:any) {
    super.handleEvent(action, payload)
    switch (action) {
      case WorkerEventActions.Worker_ChatMsg:
        console.log("[Worker_ChatMsg]", JSON.stringify(payload));
        break;
    }
  }
}

new TelegramWorker(window.WORKER_ACCOUNT as LocalWorkerAccountType).addEvents()

