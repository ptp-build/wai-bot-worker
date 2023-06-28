import {
  sendActionToMasterWindow,
  sendActionToWorkerWindow,
  sendKeyboardEventActionToWorkerWindow,
  sendMouseEventActionToWorkerWindow,

} from "./helper";
import {
  BotStatusType,
  BotWorkerStatusType,
  MasterEventActions,
  CallbackButtonAction,
  LocalWorkerAccountType, WorkerEventActions
} from "../../../types";

export default class BaseWorker {
  public botId: string;
  private readonly workerAccount: LocalWorkerAccountType;

  constructor(workerAccount: LocalWorkerAccountType) {
    this.workerAccount = workerAccount
    this.botId = workerAccount.botId;
  }
  getWorkerAccount(){
    return this.workerAccount
  }

  updateMessage(text1: string, msgId: number, chatId: string,fromBotId?:string,taskId?:number,isDone?:boolean) {
    //const {text,entities} = parseEntities(text1,[],{})
    sendActionToMasterWindow(chatId, MasterEventActions.UpdateMessage, {
      updateMessage: {
        msgId,
        chatId,
        text:text1,
        entities:[]
      },
    }).catch(console.error);
    if(fromBotId && taskId){
      sendActionToWorkerWindow(fromBotId, WorkerEventActions.Worker_TaskAiMsg, {
        taskId,
        isDone,
        updateMessage: {
          msgId,
          chatId,
          text:text1,
          entities:[]
        },
      }).catch(console.error);
    }
  }

  finishReply(msgId:number,chatId:string) {
    sendActionToMasterWindow(this.botId, MasterEventActions.FinishChatGptReply, {
      msgId,
      chatId
    }).catch(console.error);
  }


  replyMessageWithCancel(text: string, inlineButtons?: any[]) {
    if (!inlineButtons) {
      inlineButtons = [];
    }
    inlineButtons.push([
      {
        text: 'Cancel',
        data: CallbackButtonAction.Local_cancelMessage,
        type: 'callback',
      },
    ]);
    this.replyMessage(text, inlineButtons);
  }


  replyMessage(text: string, inlineButtons?: any[], chatId?: string) {
    sendActionToMasterWindow(chatId ?? this.botId, MasterEventActions.NewMessage, {
      newMessage: {
        chatId: chatId ? chatId : this.botId,
        text,
        inlineButtons: inlineButtons || undefined,
      },
    }).catch(console.error);
  }

  askMessageByTaskWorker(text: string,taskId:number) {
    sendActionToMasterWindow(this.botId, MasterEventActions.NewMessageByTaskWorker, {
      newMessage: {
        chatId: this.botId,
        text,
      },
      taskId
    }).catch(console.error);
  }

  sendKeyboardEvent(type: 'char' | 'keyUp' | 'keyDown', keyCode: string) {
    sendKeyboardEventActionToWorkerWindow(this.botId, type, keyCode).catch(console.error);
  }

  sendCharKeyboardEvent(keyCode: string) {
    this.sendKeyboardEvent('char', keyCode);
  }

  sendMouseEvent(button:"left" | "right", type:"mouseDown"| "mouseUp", x:number, y:number) {
    return sendMouseEventActionToWorkerWindow(this.botId, {
      button,
      type,
      x,
      y
    }).catch(console.error);
  }

  sendEnterKeyboardEvent() {
    this.sendCharKeyboardEvent('\u000d');
  }
  sendSpaceKeyboardEvent() {
    this.sendCharKeyboardEvent('\u0020');
  }
  sendBackSpaceKeyboardEvent() {
    this.sendKeyboardEvent('keyDown', '\u0008');
  }

  reportStatus(statusBot: BotStatusType,statusBotWorker:BotWorkerStatusType) {
    sendActionToMasterWindow(this.botId, MasterEventActions.UpdateWorkerStatus, {
      statusBot,
      statusBotWorker,
      botId: this.botId,
    }).catch(console.error);
  }

  getWorkersStatus() {
    sendActionToMasterWindow(this.botId, MasterEventActions.GetWorkersStatus, {
      botId: this.botId,
    }).catch(console.error);
  }
  messageListScrollDownEnd() {
    sendActionToMasterWindow(this.botId, MasterEventActions.MessageListScrollDownEnd, {
      chatId:this.botId,
    }).catch(console.error);
  }
}
