import { ChatGptStreamStatus, MsgAction, UserAskChatGptMsg_Type } from '../../../../lib/ptp/protobuf/PTPCommon/types';
import BotWebSocket from '../../BotWebSocket';
import { ChatGpWorker } from './ChatGpWorker';


export class ChatGptMsgProcessor {
  private worker:ChatGpWorker;
  constructor(worker:ChatGpWorker) {
    this.worker = worker
  }
  private msgId?: number;
  private chatId?: string;
  private text?: string;
  private replyTextTmp?: string;
  private cacheReplyText?: Record<string, boolean>;
  private lastText?: string;
  private msgDate?: number;
  private msgAskId?: number;
  private msgAskDate?: number;
  private part?: string;
  private senderId?: string;
  private index?: number;

  setPayload(paload: UserAskChatGptMsg_Type) {
    const {text, chatId, msgId, msgDate, msgAskId, msgAskDate, senderId} = paload;
    this.part = '';
    this.lastText = '';
    this.replyTextTmp = '';
    this.index = 0;
    this.cacheReplyText = {};
    this.text = text!;
    this.chatId = chatId!;
    this.msgId = msgId!;
    this.msgDate = msgDate!;
    this.msgAskId = msgAskId!;
    this.msgAskDate = msgAskDate!;
    this.senderId = senderId!;
    return this
  }

  async process() {
    let { text } = this;
    await this.worker.askMsg(text!);
  }

  reply(status: ChatGptStreamStatus, text?: string) {
    console.debug("[reply]",status,text)
    this.worker.setState(status);
    let { chatId, msgId, msgDate, msgAskId, msgAskDate, senderId } = this;

    BotWebSocket.sendMsgReqWithQueue(
      MsgAction.MsgAction_WaiChatGptBotAckMsg,
      {
        chatGptBotId:this.worker.getBotId(),
        senderId,
        text,
        chatId,
        msgDate,
        msgAskId,
        msgAskDate,
        msgId,
        streamStatus: status,
      }).catch(console.error)
  }

  onStart() {
    this.reply(ChatGptStreamStatus.ChatGptStreamStatus_START, '...');
  }

  onError(err: string) {
    this.reply(ChatGptStreamStatus.ChatGptStreamStatus_ERROR, err);
  }

  onData(err: string) {
    this.reply(ChatGptStreamStatus.ChatGptStreamStatus_ERROR, err);
  }
}
