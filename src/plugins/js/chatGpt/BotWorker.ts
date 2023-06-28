import BotWorkerSelector from "./BotWorkerSelector";
import BaseWorker from "../common/BaseWorker";
import {
  BotStatusType,
  BotWorkerStatusType,
  LocalWorkerAccountType, MasterEventActions, NewMessage,
  WorkerCallbackButtonAction,
  WorkerEventActions,
  WorkerEvents,
} from '../../../types';
import ChatGptMsg from "./ChatGptMsg";
import MsgHelper from "../../../masterChat/MsgHelper";
import {sleep} from "../../../utils/utils";
import {sendActionToMasterWindow} from "../common/helper";
import {parseEntities} from "../../../utils/stringParse";

export default class BotWorker extends BaseWorker {
  private selector = new BotWorkerSelector();
  private username = "";
  private password = "";
  private statusBot:BotStatusType;
  private statusBotWorker:BotWorkerStatusType;
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
    console.log("[BotWorker INIT]",this.botId)
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
        this.statusBot = BotStatusType.ONLINE
        this.statusBotWorker = BotWorkerStatusType.Ready
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
    this.reportStatus(this.statusBot,this.statusBotWorker)
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
    }
  }

  clickRegenerateResponseButton() {
    if (this.selector.regenerateResponseButton.length > 0) {
      this.statusBotWorker = BotWorkerStatusType.InvokeApiError;
      this.selector.regenerateResponseButton.click();
    }
  }

  async askMsg({ text, updateMessage,fromBotId,taskId }:{text:string,updateMessage:NewMessage,fromBotId?:string,taskId?:number}) {
    if (
      this.chatGptMsg ||
      this.statusBotWorker !== BotWorkerStatusType.Ready ||
      this.statusBot !== BotStatusType.ONLINE
    ) {
      this.reportStatus(this.statusBot,this.statusBotWorker)
      console.log("[askMsg] stopped", this.statusBot, this.statusBotWorker);
      return;
    }

    const { msgId, chatId } = updateMessage;
    this.chatGptMsg = new ChatGptMsg(msgId, chatId,fromBotId,taskId);
    await this.sendPromptTextareaMouseClick()
    this.inputPrompts(text);
    await this.sendSpaceKeyboardEvent();
    await sleep(100)
    this.performClickSendPromptButton();
  }

  onSteamMsgRecv({ state, text, index }:{state:"START"|"ERROR"|"IN_PROCESS",text:string,index:number}) {
    console.log("[onSteamMsgRecv]",state,index)
    if (state === "ERROR") {
      this.statusBotWorker = BotWorkerStatusType.InvokeApiError;
    }
    if (state === "IN_PROCESS" && this.chatGptMsg) {
      const res = this.chatGptMsg.parseOnData(text);
      this.messageListScrollDownEnd();
      if (res.state === "DONE") {
        console.log("[DONE]", this.chatGptMsg.chatId, this.chatGptMsg.msgId, res.text);
        if(this.chatGptMsg.msgId){
          this.updateMessage(res.text, this.chatGptMsg.msgId, this.chatGptMsg.chatId,this.chatGptMsg.fromBotId,this.chatGptMsg.taskId,true);
          this.finishReply(this.chatGptMsg.msgId, this.chatGptMsg.chatId);
        }
        this.statusBotWorker = BotWorkerStatusType.Ready
        this.chatGptMsg = undefined;
        this.reportStatus(this.statusBot,this.statusBotWorker)
      } else if (index % 2 === 0) {
        this.updateMessage(res.text, this.chatGptMsg.msgId, this.chatGptMsg.chatId,this.chatGptMsg.fromBotId,this.chatGptMsg.taskId);
        this.reportStatus(this.statusBot,this.statusBotWorker)
      }
    }
  }

  inputPrompts(text:string) {
    this.statusBotWorker = BotWorkerStatusType.Busy
    this.reportStatus(this.statusBot,this.statusBotWorker)
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

  test(){
    const template = 'Sample text with```python\nprint("hello")\n``` `bold`, /code @mention, and #tag';
    const {text,entities} = parseEntities(template,["code"],{})
    console.log("parseEntities",text,JSON.stringify(entities))

    sendActionToMasterWindow(this.botId, MasterEventActions.NewMessage, {
      newMessage: {
        chatId:this.botId,
        text,
        entities,
        inlineButtons:[
          [
            MsgHelper.buildCancelCallBackAction("Cancel")
          ]
        ]
      },
    }).catch(console.error);
  }
  async handleCallBackButton({ path }:{path:string}) {
    const statusBots = [
      BotStatusType.LoginButtonClickNeed,
      BotStatusType.LoginInputUsernameNeed,
      BotStatusType.LoginInputPasswordNeed,
      BotStatusType.RegenerateResponseNeed
    ]
    const action = path.replace("Worker_","")
    for (let i = 0; i < statusBots.length; i++) {
      switch (action) {
        case BotStatusType.LoginButtonClickNeed:
          this.clickLoginButton();
          return
        case BotStatusType.LoginInputUsernameNeed:
          await this.inputUsername();
          return
        case BotStatusType.LoginInputPasswordNeed:
          await this.inputPassword();
          return
        case BotStatusType.RegenerateResponseNeed:
          this.clickRegenerateResponseButton();
          return
      }
    }
    switch (path) {
      case WorkerCallbackButtonAction.Worker_getCommands:
        this.replyMessageWithCancel("Test Commands", [
          [
            MsgHelper.buildCallBackAction("clickLoginButton",WorkerCallbackButtonAction.Worker_clickLoginButton)
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
            MsgHelper.buildCallBackAction("clickRegenerateResponseButton",WorkerCallbackButtonAction.Worker_clickRegenerateResponseButton)
          ],
        ]);
        break;
      case WorkerCallbackButtonAction.Worker_sendPromptTextareaMouseClick:
        void await this.sendPromptTextareaMouseClick();
        break;
      case WorkerCallbackButtonAction.Worker_inputPrompts:
        this.chatGptMsg = new ChatGptMsg(0, this.botId);
        this.inputPrompts("Ping, you reply: Pong!!!");
        break;
      case WorkerCallbackButtonAction.Worker_sendInputSpaceEvent:
        this.sendSpaceKeyboardEvent();
        break;
      case WorkerCallbackButtonAction.Worker_performClickSendPromptButton:
        this.performClickSendPromptButton();
        break;
      case WorkerCallbackButtonAction.Worker_locationReload:
        location.reload()
        break;
    }
  }

  handleEvent(action:WorkerEventActions, payload:any) {
    switch (action) {
      case WorkerEventActions.Worker_GetWorkerStatus:
        this.reportStatus(this.statusBot,this.statusBotWorker)
        break;
      case WorkerEventActions.Worker_CallBackButton:
        console.log("[Worker_CallBackButton]", JSON.stringify(payload));
        this.handleCallBackButton(payload).catch(console.error);
        break;
      case WorkerEventActions.Worker_AskMsg:
        console.log("[Worker_AskMsg]", JSON.stringify(payload));
        this.askMsg(payload).catch(console.error);
        break;
    }
  }

  addEvents() {
    window.electron?.on(WorkerEvents.Worker_Chat_Msg, async (botId:string, action:WorkerEventActions, payload:any) => {
      await this.handleEvent(action, payload);
    });
    return this;
  }
}
