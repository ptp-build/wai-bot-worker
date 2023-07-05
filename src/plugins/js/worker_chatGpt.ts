import BotWorkerSelector from './chatGpt/BotWorkerSelector';
import BaseWorker from './common/BaseWorker';
import {
  BotStatusType,
  BotWorkerStatusType,
  LocalWorkerAccountType,
  NewMessage,
  WorkerCallbackButtonAction,
  WorkerEventActions,
} from '../../types';
import ChatGptMsg from './chatGpt/ChatGptMsg';
import MsgHelper from './../../masterChat/MsgHelper';
import { sleep } from '../../utils/utils';
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
  Worker_newConversations = "Worker_newConversations"
}

class ChatGptBotWorker extends BaseWorker {
  private selector = new BotWorkerSelector();
  private username = "";
  private password = "";
  private chatGptMsg?:ChatGptMsg;
  constructor(workerAccount:LocalWorkerAccountType) {
    super(workerAccount);
    this.setChatGptAuth(workerAccount.chatGptAuth)
    this.statusBot = BotStatusType.STARTED;
    this.statusBotWorker = BotWorkerStatusType.WaitToReady
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
    setInterval(() => this.loop(), 1000);
  }

  loop() {
    document.title = ("# "+this.getWorkerAccount().botId + " ChatGpt")
    if (this.selector.regenerateResponseButton.length > 0) {
      this.statusBot = BotStatusType.RegenerateResponseNeed;
    }
    if (this.selector.loginButton.length > 0) {
      this.statusBot = BotStatusType.LoginButtonClickNeed
    }
    if (
      this.selector.promptTextArea.length > 0 &&
      this.selector.startPopUpModal.length === 0
    ) {
      if (this.statusBot !== BotStatusType.ONLINE) {
        void this.onReady()
      }
    }

    if (this.selector.loginPage.length > 0) {
      this.statusBot = BotStatusType.LoginInputUsernameNeed
    }

    if (this.selector.loginPasswordPage.length > 0) {
      this.statusBot = BotStatusType.LoginInputPasswordNeed
    }
    if (this.selector.challengeForm.length > 0) {
      this.statusBot = BotStatusType.ChallengeFormShow
    }
    // console.log("[Loop]", this.statusBot, this.statusBotWorker);
    this.reportStatus()
    this.performFirstPopupClick();
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
      this.statusBotWorker = BotWorkerStatusType.InvokeApiError;
      this.selector.regenerateResponseButton.click();
    }
  }

  async askMsg({ text,updateMessage,fromBotId,taskId }:{text:string,updateMessage:NewMessage,fromBotId?:string,taskId?:number}) {
    if (
      this.chatGptMsg ||
      this.statusBotWorker !== BotWorkerStatusType.Ready ||
      this.statusBot !== BotStatusType.ONLINE
    ) {
      this.reportStatus()
      console.log("[askMsg] stopped", this.statusBot, this.statusBotWorker);
      return;
    }

    const { msgId, chatId } = updateMessage;

    let conversation_id = window.localStorage.getItem(`CHAT_Conversation_${chatId}`)
    if( window.localStorage.getItem(`Conversation_DELETE_${conversation_id}`)){
      conversation_id = null
      window.localStorage.removeItem(`CHAT_Conversation_${chatId}`)
      window.localStorage.removeItem(`Conversation_DELETE_${conversation_id}`)
    }
    if(conversation_id){
      const {pathname,origin} = new URL(window.location.href)
      if(!pathname.includes(conversation_id)){
        window.localStorage.setItem(`Conversation_Current`,conversation_id)
        window.localStorage.setItem(`WAITING_Msg`,JSON.stringify({text, updateMessage,fromBotId,taskId}))
        this.statusBotWorker = BotWorkerStatusType.Busy
        await this.reportStatus()
        window.location.href = `${origin}/c/${conversation_id}`
        return
      }
    }
    this.chatGptMsg = new ChatGptMsg(msgId, chatId,fromBotId,taskId);
    await this.sendPromptTextareaMouseClick()
    this.inputPrompts(text);
    await this.sendSpaceKeyboardEvent();
    await sleep(100)
    this.performClickSendPromptButton();
  }
  async newAiMsg(text:string){
    await this.replyMessage(text,[],this.botId,true,"1",true)
    const msgId = await this.replyMessage("...",[],this.botId)
    this.chatGptMsg = new ChatGptMsg(msgId!, this.botId);
  }
  handleResult(result:string){
    const {replyParser} = this.getWorkerAccount()

    if(replyParser){
      try {
        const code = `return ${replyParser};`;
        const func = new Function('result', code);
        const parseResult = func(result);
        if(parseResult){
          result = parseResult;
        }else{
          result = `${code} eval error`
        }
        console.log(result);
      }catch (e){
        console.log(e)
      }
    }
    return result
  }
  onSteamMsgRecv({ state, text, index }:{state:"REQUEST"|"START"|"ERROR"|"IN_PROCESS",text:string,index:number}) {
    console.log("[onSteamMsgRecv]",state,index)
    if (state === "ERROR") {
      this.statusBotWorker = BotWorkerStatusType.InvokeApiError;
    }
    if (state === "REQUEST") {
      if(!this.chatGptMsg){
        this.newAiMsg(text).catch(console.error)
      }
      return
    }
    if (state === "IN_PROCESS" && this.chatGptMsg) {
      const res = this.chatGptMsg.parseOnData(text);
      const conversation_id = res.conversation_id

      if (res.state === "DONE") {
        console.log("[DONE]", this.chatGptMsg.chatId, this.chatGptMsg.msgId, res.text);
        if(this.chatGptMsg.msgId){
          const result = this.handleResult(res.text)
          this.updateMessage(result, this.chatGptMsg.msgId, this.chatGptMsg.chatId,this.chatGptMsg.fromBotId,this.chatGptMsg.taskId,true);
          this.finishReply(this.chatGptMsg.msgId, this.chatGptMsg.chatId);
        }
        this.statusBotWorker = BotWorkerStatusType.Ready
        this.reportStatus()
        if(this.chatGptMsg && conversation_id && !window.location.href.includes(conversation_id)){
          window.localStorage.setItem(`CHAT_Conversation_${this.chatGptMsg.chatId}`,conversation_id)
          window.localStorage.setItem(`Conversation_Current`,conversation_id)
          const uri = new URL(window.location.href)
          window.location.href = `${uri.origin}/c/${conversation_id}`
        }
        this.chatGptMsg = undefined;
      } else if (index % 2 === 0) {

        this.updateMessage(res.text, this.chatGptMsg.msgId, this.chatGptMsg.chatId,this.chatGptMsg.fromBotId,this.chatGptMsg.taskId);
        this.reportStatus()
      }
    }
  }

  inputPrompts(text:string) {
    this.statusBotWorker = BotWorkerStatusType.Busy
    this.reportStatus()
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
      await this.sendEscKeyboardEvent()
    }
  }
  actions(){
    return [
      ...super.actions(),
      [
        MsgHelper.buildCallBackAction("clickLoginButton","Worker_LoginButtonClickNeed")
      ],
      [
        MsgHelper.buildCallBackAction("loginInputUsernameNeed","Worker_LoginInputUsernameNeed")
      ],
      [
        MsgHelper.buildCallBackAction("loginInputPasswordNeed","Worker_LoginInputPasswordNeed")
      ],
      [
        MsgHelper.buildCallBackAction("regenerateResponseNeed","Worker_RegenerateResponseNeed")
      ],
      [
        MsgHelper.buildCallBackAction("sendPromptTextareaMouseClick",WorkerCallbackButtonAction.Worker_sendPromptTextareaMouseClick)
      ],
      [
        MsgHelper.buildCallBackAction("inputPrompts",WorkerCallbackButtonAction.Worker_inputPrompts)
      ],
      [
        MsgHelper.buildCallBackAction("sendInputSpaceEvent",WorkerCallbackButtonAction.Worker_sendInputSpaceEvent)
      ],
      [
        MsgHelper.buildCallBackAction("performClickSendPromptButton",WorkerCallbackButtonAction.Worker_performClickSendPromptButton)
      ],

      [
        MsgHelper.buildCallBackAction("Clear conversations",ChatGptCallbackButtonAction.Worker_clearConversations)
      ],
      [
        MsgHelper.buildCallBackAction("New conversations",ChatGptCallbackButtonAction.Worker_newConversations)
      ],
    ]
  }

  async handleCallBackButton({ path,messageId }:{path:string,messageId:number}) {
    await super.handleCallBackButton({path})
    switch (path) {
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
        this.askMsg(payload).catch(console.error);
        break;
    }
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
    if(WAITING_Msg){
      window.localStorage.removeItem(`WAITING_Msg`)
      await this.askMsg(JSON.parse(WAITING_Msg))
    }else{
      this.statusBot = BotStatusType.ONLINE
      this.statusBotWorker = BotWorkerStatusType.Ready
      this.reportStatus()
    }
  }
}

new ChatGptBotWorker(window.WORKER_ACCOUNT as LocalWorkerAccountType).addEvents()
