import BotWorkerSelector from './chatGpt/BotWorkerSelector';
import BaseWorker from '../../sdk/botWorker/BaseWorker';
import {
  BotStatusType,
  CallbackButtonAction,
  LocalWorkerAccountType,
  WorkerCallbackButtonAction,
  WorkerEventActions,
} from '../../sdk/types';
import ChatGptMsg from './chatGpt/ChatGptMsg';
import { sleep } from '../../sdk/common/time';
import MsgHelper from '../../sdk/helper/MsgHelper';

const {$} = window

function hook_fetch(botWorker:ChatGptBotWorker): void {
  const originalFetch = window.fetch;
  window.fetch = async function (...args: any[]): Promise<Response> {
    const url = args[0];
    let uri: URL;
    try {
      uri = new URL(url);
    } catch (e) {
      // @ts-ignore
      return await originalFetch.apply(this, args);
    }

    const options = args[1];
    let index = -1;
    if (options && options.signal && url.indexOf('backend-api/conversation') > 0) {
      if(botWorker){
        botWorker.onSteamMsgRecv({ state: "REQUEST", index, text: JSON.parse(options.body).messages[0].content.parts[0]});
      }
    }
    index += 1;
    // @ts-ignore
    const response = await originalFetch.apply(this, args);
    if(response.status === 404){
      const Conversation_Current = window.localStorage.getItem(`Conversation_Current`)
      if(Conversation_Current && url.indexOf('backend-api/conversation/'+Conversation_Current) > 0){
        window.localStorage.removeItem(`Conversation_Current`)
        window.localStorage.setItem(`Conversation_DELETE_${Conversation_Current}`,"1")
      }
    }
    if (options && options.signal && url.indexOf('backend-api/conversation') > 0) {
      if (response.ok) {
        if (response.body && options) {
          if(botWorker){
            botWorker.onSteamMsgRecv({ state: "START", index, text: "" });
          }
          const transformStream = new TransformStream({
            transform(chunk, controller) {
              controller.enqueue(chunk);
              index += 1;
              const decoder = new TextDecoder();
              const text = decoder.decode(chunk);
              if(botWorker){
                botWorker.onSteamMsgRecv({ state: "IN_PROCESS", index, text });
              }
            },
          });
          response.body.pipeThrough(transformStream);
          return new Response(transformStream.readable, {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText,
          });
        } else {
          const error = 'ERR_CODE: ' + response.status;
          if(botWorker){
            botWorker.onSteamMsgRecv({ state: "ERROR", index,text: error });
          }
        }
      } else {
        const error = await response.clone().text();
        if(botWorker){
          botWorker.onSteamMsgRecv({ state: "ERROR", index,text: error });
        }
      }
    }
    return response;
  };
}

export enum ChatGptCallbackButtonAction {
  Worker_clearConversations = "Worker_clearConversations",
  Worker_newConversations = "Worker_newConversations",

}

class ChatGptBotWorker extends BaseWorker {
  private selector = new BotWorkerSelector();
  private username = "";
  private password = "";
  private chatGptMsg?:ChatGptMsg;
  constructor(workerAccount:LocalWorkerAccountType) {
    super(workerAccount);
    this.setChatGptAuth(workerAccount.chatGptAuth)
    this.reportStatus(BotStatusType.ONLINE)
    this.init();
  }

  setChatGptAuth(auth?:string) {
    if (auth && auth.split(":").length === 2) {
      this.username = auth.split(":")[0];
      this.password = auth.split(":")[1];
    }
    if (auth && auth.split(" ").length === 2) {
      this.username = auth.split(" ")[0];
      this.password = auth.split(" ")[1];
    }
    return this;
  }

  init() {
    console.log("[BotWorker INIT]",this.botId,window.location.href)
    hook_fetch(this)
    this.loop()
  }

  loop() {
    if (this.selector.regenerateResponseButton.length > 0) {
      // this.statusBot = ChatGptCallbackButtonAction.RegenerateResponseNeed;
    }
    if (this.selector.loginButton.length > 0) {
      // this.statusBot = ChatGptCallbackButtonAction.LoginButtonClickNeed
    }
    if (
      this.selector.promptTextArea.length > 0 &&
      this.selector.startPopUpModal.length === 0
    ) {
      if (this.statusBot === BotStatusType.ONLINE) {
        void this.onReady()
      }
    }

    if (this.selector.loginPage.length > 0) {
      // this.statusBot = BotStatusType.LoginInputUsernameNeed
    }

    if (this.selector.loginPasswordPage.length > 0) {
      // this.statusBot = BotStatusType.LoginInputPasswordNeed
    }
    if (this.selector.challengeForm.length > 0) {
      // this.statusBot = BotStatusType.ChallengeFormShow
    }
    // console.log("[Loop]", this.statusBot, this.statusBotWorker);
    this.reportStatus()
    //this.performFirstPopupClick();
    setTimeout(() => this.loop(), 1000);
  }

  performFirstPopupClick() {
    if (this.selector.startPopUpModal.length > 0 && this.selector.startPopUpModalButton) {
      this.selector.startPopUpModalButton.click();
    }
  }

  challengeBot() {

  }

  async inputUsername() {
    if (this.selector.loginPage.length > 0) {
      if (this.selector.usernameInputPageContinueButton.length > 0) {
        this.selector.usernameInput.val(this.username);
        await sleep(100);
        this.selector.usernameInputPageContinueButton.click();
      }
    }
  }

  async inputPassword() {
    if (this.selector.loginPasswordPage.length > 0) {
      if (this.selector.passwordInputPageContinueButton.length > 0) {
        this.selector.passwordInput.val(this.password);
        await sleep(100);
        this.selector.passwordInputPageContinueButton.click();
      }
    }
  }

  clickLoginButton() {
    if (this.selector.loginButton.length > 0) {
      this.selector.loginButton.click();
      this.replyTextWithCancel("Login...");
    }else{
      this.replyTextWithCancel("Login page not found");
    }
  }

  clickRegenerateResponseButton() {
    if (this.selector.regenerateResponseButton.length > 0) {
      this.reportStatus(BotStatusType.InvokeApiError)
      this.selector.regenerateResponseButton.click();
    }
  }

  async askMsg({ text,chatId,msgId }:{text:string,chatId:string,msgId?:number}) {
    if (
      this.chatGptMsg ||
      this.statusBot !== BotStatusType.READY
    ) {
      if(!this.chatGptMsg && this.selector.promptTextArea.length > 0 && this.selector.promptTextArea.val().length === 0){
        this.statusBot = BotStatusType.READY
        this.reportStatus()
      }else{
        this.reportStatus()
        console.log("[askMsg] stopped", this.statusBot);
        return;
      }
    }
    if(!msgId){
      msgId = await this.applyMsgId(chatId)
    }
    let conversation_id = window.localStorage.getItem(`CHAT_Conversation3_${chatId}`)
    if( window.localStorage.getItem(`Conversation_DELETE_${conversation_id}`)){
      conversation_id = null
      window.localStorage.removeItem(`CHAT_Conversation3_${chatId}`)
      window.localStorage.removeItem(`Conversation_DELETE_${conversation_id}`)
    }
    if(conversation_id){
      const {pathname,origin} = new URL(window.location.href)
      if(!pathname.includes(conversation_id)){
        window.localStorage.setItem(`Conversation_Current`,conversation_id)
        window.localStorage.setItem(`WAITING_Msg`,JSON.stringify({text, msgId,chatId}))
        await this.reportStatus(BotStatusType.Busy)
        window.location.href = `${origin}/c/${conversation_id}`
        return
      }
    }else{
      await this.newConversations()
      await sleep(2000)
    }
    this.chatGptMsg = new ChatGptMsg(msgId!, chatId);
    await this.replyMsg({
      chatId:this.chatGptMsg?.chatId!,
      msgId:this.chatGptMsg?.msgId!,
      text:"...",
      senderId:this.botId
    })
    await this.sendPromptTextareaMouseClick()
    await sleep(100)

    this.inputPrompts(text);
    await sleep(100)
    await this.sendSpaceKeyboardEvent();
    await sleep(100)
    this.performClickSendPromptButton();
  }
  async newAiMsg(text:string){
    const conversation_id = window.localStorage.getItem(`Conversation_Current`)
    const chatId = window.localStorage.getItem(`Conversation_CHAT_${conversation_id}`)
    await this.replyMessage(text,[],chatId || this.botId,true,"1",true)
    const msgId = await this.replyMessage('...', [], chatId || this.botId)
    this.chatGptMsg = new ChatGptMsg(msgId!, chatId || this.botId);
  }
  onSteamMsgRecv({ state, text, index }:{state:"REQUEST"|"START"|"ERROR"|"IN_PROCESS",text:string,index:number}) {
    console.log("[onSteamMsgRecv]",state,index)
    if (state === "ERROR") {
      this.reportStatus(BotStatusType.InvokeApiError)
    }
    if (state === "REQUEST") {
      if(!this.chatGptMsg){
        this.newAiMsg(text).catch(console.error)
      }

      void this.replyMsg({
        chatId:this.chatGptMsg?.chatId!,
        msgId:this.chatGptMsg?.msgId!,
        text:"...",
        senderId:this.botId
      })
      return
    }
    if (state === "IN_PROCESS" && this.chatGptMsg) {
      const res = this.chatGptMsg.parseOnData(text);
      const conversation_id = res.conversation_id

      if (res.state === "DONE") {
        console.log("[DONE]", this.chatGptMsg.chatId, this.chatGptMsg.msgId, res.text);
        if(this.chatGptMsg.msgId){
          const result = MsgHelper.handleReplyText(res.text,this.getWorkerAccount().replyParser)
          void this.updateMsg({
            chatId:this.chatGptMsg.chatId,
            msgId:this.chatGptMsg.msgId,
            text:result
          })
          this.finishReply(this.chatGptMsg.msgId, this.chatGptMsg.chatId);
        }
        this.reportStatus(BotStatusType.READY)
        if(this.chatGptMsg && conversation_id && !window.location.href.includes(conversation_id)){
          window.localStorage.setItem(`CHAT_Conversation3_${this.chatGptMsg.chatId}`,conversation_id)
          window.localStorage.setItem(`Conversation_CHAT_${conversation_id}`,this.chatGptMsg.chatId)
          window.localStorage.setItem(`Conversation_Current`,conversation_id)
          const uri = new URL(window.location.href)
          window.location.href = `${uri.origin}/c/${conversation_id}`
        }
        this.chatGptMsg = undefined;
      } else if (index % 2 === 0) {
        void this.updateMsg({
          chatId:this.chatGptMsg.chatId,
          msgId:this.chatGptMsg.msgId,
          text:res.text
        })
        this.reportStatus()
      }
    }
  }

  inputPrompts(text:string) {
    this.reportStatus(BotStatusType.Busy)

    this.selector.promptTextArea.val(text);
  }

  async sendPromptTextareaMouseClick() {
    const {left,top,width,height} = this.selector.promptTextArea.offset()
    await this.sendMouseEvent("left","mouseDown",left + width / 2 ,top + height / 2)
    await sleep(50)
    await this.sendMouseEvent("left","mouseUp",left + width / 2 ,top + height / 2)
    await sleep(50)
  }

  performClickSendPromptButton() {
    if (
      this.selector.promptSendButton.length > 0 &&
      this.selector.promptTextArea.val().length > 0 &&
      !this.selector.promptSendButton[0].disabled
    ) {
      this.selector.promptSendButton.click();
    }
  }
  async clearConversations() {
    const mainParent = $("main").parent()
    if(mainParent.children().length === 2){
      $("main").parent().children().eq(0).find("button").eq(0).click()
      await sleep(300)
    }
    if(document.getElementById("headlessui-menu-button-:r8:")){
      $(document.getElementById("headlessui-menu-button-:r8:")).click()
    }
    await sleep(1000)
    if($("nav[role=none]").children().eq(0).text() === 'Clear conversations'){
      $("nav[role=none]").children().eq(0).click()
    }
    await sleep(1000)
    if($("nav[role=none]").children().eq(0).text() === 'Confirm clear conversations'){
      $("nav[role=none]").children().eq(0).click()
    }
  }

  async newConversations() {
    const mainParent = $("main").parent()
    if(mainParent.children().length === 1){
      $("."+ "mb-1 flex flex-row gap-2".split(" ").join(".")).find("a").click();
    }else{
      $("main").parent().children().eq(0).find("button").eq(0).click()
      await sleep(300)
      $("."+ "mb-1 flex flex-row gap-2".split(" ").join(".")).find("a").click();
      await sleep(300)
      await this.sendEscKeyboardEvent()
    }
  }

  async help(chatId:string) {
    let text = "\n🎓使用帮助\n";
    text += "\n💡 如何设置角色\n";
    text += "\n1️⃣ 打开 Telegram app ";

    return this.reply(chatId, text, true)
  }
  actions(chatId?:string){

    return [
      ...super.actions(chatId),
      [this.buildCallBackAction("👤 帐户中心","Worker_OpenPlatForm")],
      [this.buildCallBackAction("🔐 用户名密码",CallbackButtonAction.Local_setupChatGptAuth)],
      // [
      //   this.buildCallBackAction("clickLoginButton","Worker_LoginButtonClickNeed")
      // ],
      // [
      //   this.buildCallBackAction("loginInputUsernameNeed","Worker_LoginInputUsernameNeed")
      // ],
      // [
      //   this.buildCallBackAction("loginInputPasswordNeed","Worker_LoginInputPasswordNeed")
      // ],
      // [
      //   this.buildCallBackAction("regenerateResponseNeed","Worker_RegenerateResponseNeed")
      // ],
      // [
      //   this.buildCallBackAction("sendPromptTextareaMouseClick",WorkerCallbackButtonAction.Worker_sendPromptTextareaMouseClick)
      // ],
      // [
      //   this.buildCallBackAction("inputPrompts",WorkerCallbackButtonAction.Worker_inputPrompts)
      // ],
      // [
      //   this.buildCallBackAction("sendInputSpaceEvent",WorkerCallbackButtonAction.Worker_sendInputSpaceEvent)
      // ],
      // [
      //   this.buildCallBackAction("performClickSendPromptButton",WorkerCallbackButtonAction.Worker_performClickSendPromptButton)
      // ],
      //
      // [
      //   this.buildCallBackAction("Clear conversations",ChatGptCallbackButtonAction.Worker_clearConversations)
      // ],
      // [
      //   this.buildCallBackAction("New conversations",ChatGptCallbackButtonAction.Worker_newConversations)
      // ],
    ]
  }

  async handleCallBackButton(payload:{path:string,messageId:number,chatId:string}) {
    const { path} = payload
    await super.handleCallBackButton(payload)
    switch (path) {
      case "Worker_OpenPlatForm":
        await this.getBridgeWorkerWindow().loadUrl({url:"https://platform.openai.com"})
        return
      case "Worker_LoginButtonClickNeed":
        this.clickLoginButton();
        return
      case "Worker_LoginInputUsernameNeed":
        await this.inputUsername();
        return
      case "Worker_LoginInputPasswordNeed":
        await this.inputPassword();
        return
      case "Worker_RegenerateResponseNeed":
        this.clickRegenerateResponseButton();
        return
      case WorkerCallbackButtonAction.Worker_sendPromptTextareaMouseClick:
        void await this.sendPromptTextareaMouseClick();
        break;
      case WorkerCallbackButtonAction.Worker_inputPrompts:
        const text = "Ping, you reply: Pong!!!";
        this.inputPrompts(text);
        break;
      case WorkerCallbackButtonAction.Worker_sendInputSpaceEvent:
        await this.sendSpaceKeyboardEvent();
        break;
      case WorkerCallbackButtonAction.Worker_performClickSendPromptButton:
        this.performClickSendPromptButton();
        break;
      case ChatGptCallbackButtonAction.Worker_clearConversations:
        await this.clearConversations()
        break;
      case ChatGptCallbackButtonAction.Worker_newConversations:
        await this.newConversations()
        break;
    }
  }

  handleEvent(action:WorkerEventActions, payload:any) {
    super.handleEvent(action, payload)
    switch (action) {
      case WorkerEventActions.Worker_ChatMsg:
        console.log("[Worker_ChatMsg]", JSON.stringify(payload));
        void this.onMessage(payload)
        break;
    }
  }

  async onMessage({text,chatId}:{text:string,chatId:string}){
    this.askMsg({text,chatId}).catch(console.error);
  }
  async onReady() {
    const Conversation_Current = window.localStorage.getItem(`Conversation_Current`)
    if(Conversation_Current){
      const {pathname,origin} = new URL(window.location.href)
      if(!pathname.includes(Conversation_Current)){
        window.location.href = `${origin}/c/${Conversation_Current}`
        return
      }
    }
    const WAITING_Msg = window.localStorage.getItem(`WAITING_Msg`)
    this.reportStatus(BotStatusType.READY)
    if(WAITING_Msg){
      window.localStorage.removeItem(`WAITING_Msg`)
      await sleep(3000)
      this.chatGptMsg = undefined
      await this.askMsg(JSON.parse(WAITING_Msg))
    }
    await sleep(3000)
  }
}

new ChatGptBotWorker(window.WORKER_ACCOUNT as LocalWorkerAccountType).addEvents()
