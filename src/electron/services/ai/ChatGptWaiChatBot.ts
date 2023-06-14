import { ChatGptStreamStatus } from '../../../lib/ptp/protobuf/PTPCommon/types';
import { Pdu } from '../../../lib/ptp/protobuf/BaseMsg';
import { SendBotMsgReq } from '../../../lib/ptp/protobuf/PTPMsg';
import BotWebSocket from '../BotWebSocket';
import WaiBridge from '../../../worker/msg/WaiBridge';

let msgList: number[] = [];
let msgObjects: Record<number, ChatGptWaiChatBot> = {};
let loading = false;

let currentMsgId: number = 0;

export class ChatGptWaiChatBot {
  private status: ChatGptStreamStatus;
  private msgId: number;
  private chatId: string;
  private text: string;
  private replyTextTmp: string;
  private cacheReplyText: Record<string, boolean>;
  private lastText: string;
  private msgDate: number;
  private msgAskId: number;
  private msgAskDate: number;
  private part: string;
  private senderId: string;
  private index: number;

  constructor(pdu: Pdu) {
    this.part = '';
    this.lastText = '';
    this.replyTextTmp = '';
    this.index = 0;
    this.cacheReplyText = {};
    this.status = ChatGptStreamStatus.ChatGptStreamStatus_WAITING;
    let { text, chatId, msgId, msgDate, msgAskId, msgAskDate, senderId } =
      SendBotMsgReq.parseMsg(pdu);
    this.text = text!;
    this.chatId = chatId!;
    this.msgId = msgId!;
    this.msgDate = msgDate!;
    this.msgAskId = msgAskId!;
    this.msgAskDate = msgAskDate!;
    this.senderId = senderId!;
  }
  async process() {
    let { msgId } = this;
    if (!msgList.includes(msgId)) {
      msgList.push(msgId);
    }
    msgObjects[msgId] = this;
    if (loading) {
      return;
    }
    loading = true;
    while (true) {
      if (msgList.length > 0) {
        const msgId: number = msgList.shift()!;
        console.log('process', msgId, msgObjects[msgId], msgList);
        await msgObjects[msgId].askChatGpt();
      } else {
        delete msgObjects[msgId];
        loading = false;
        break;
      }
    }
  }

  async askChatGpt() {
    let { text, msgId } = this;
    try {
      currentMsgId = msgId;
      console.log(
        'askChatGpt',
        msgId,
        ChatGptWaiChatBot.getCurrentMsgId(),
        ChatGptWaiChatBot.getCurrentObj()
      );
      WaiBridge.postEvent('WRITE_INPUT', { text: text });
      await this.waitForStatus(ChatGptStreamStatus.ChatGptStreamStatus_DONE);
      console.log('finish');
    } catch (e) {
      this.reply(ChatGptStreamStatus.ChatGptStreamStatus_ERROR, '请求超时');
      console.error(e);
    } finally {
      currentMsgId = 0;
      loading = false;
    }
  }
  static getCurrentMsgId() {
    return currentMsgId;
  }
  static getCurrentObj() {
    return msgObjects[currentMsgId] || null;
  }
  setState(status: ChatGptStreamStatus) {
    this.status = status;
  }

  reply(status: ChatGptStreamStatus, text?: string) {
    this.setState(status);
    console.log('[ChatGptWaiChatBot reply]', status, text);
    let { chatId, msgId, msgDate, msgAskId, msgAskDate, senderId } = this;

    BotWebSocket.getCurrentInstance().send(
      new SendBotMsgReq({
        senderId: chatId,
        toUid: senderId,
        text,
        chatId,
        msgDate,
        msgAskId,
        msgAskDate,
        msgId,
        streamStatus: status,
      })
        .pack()
        .getPbData()
    );
  }
  getState() {
    return this.status;
  }
  waitForStatus(state: ChatGptStreamStatus, timeout: number = 100000, startTime: number = 0) {
    const timeout_ = 1000;
    return new Promise<boolean>(resolve => {
      setTimeout(() => {
        if (this.getState() === state) {
          resolve(true);
        } else if (timeout > 0 && startTime >= timeout) {
          //console.debug('waitForMsgServerState timeout', startTime, timeout);
          resolve(false);
        } else {
          startTime += timeout_;
          console.log(
            '[waitForStatus]',
            startTime / 1000,
            this.msgId,
            msgList,
            msgObjects[this.msgId]
          );
          this.waitForStatus(state, timeout, startTime).then(resolve).catch(console.error);
        }
      }, timeout_);
    });
  }

  waitTime(timeout: number = 1000, startTime: number = 0) {
    const timeout_ = 1000;
    return new Promise<void>((resolve,reject) => {
      setTimeout(() => {
        if (startTime >= timeout) {
          resolve();
        } else {
          startTime += timeout_;
          this.waitTime(timeout, startTime).then(resolve).catch(reject);
        }
      }, timeout_);
    });
  }

  onRequestRemote(options: any) {
    console.log('[onRequestRemote]', options);
  }

  onStart() {
    // console.log('[onStart]');
    this.reply(ChatGptStreamStatus.ChatGptStreamStatus_START, '...');
  }

  onData(v: string) {
    // console.log('[onData]', v);
    this.replyTextTmp += v;
    if (this.replyTextTmp.startsWith('data:')) {
      let lines = this.replyTextTmp
        .substring(5)
        .split('data:')
        .filter(row => row !== '')
        .map(row => row.trim());

      if (lines && lines.length > 0) {
        this.part = '';
        lines.forEach((line, i) => {
          if (line.indexOf('{') === 0 && line.substring(line.length - 1) === '}') {
            try {
              const part = JSON.parse(line).message.content.parts[0];
              if (!this.cacheReplyText[part]) {
                console.log('part', part);
                this.part = part;
                this.cacheReplyText[part] = true;
                // const msgText = part.replace(this.lastText, '');
                // this.index++;
                // this.reply(
                //   ChatGptStreamStatus.ChatGptStreamStatus_GOING,
                //   this.index + '_' + msgText
                // );
                this.lastText = part;
              }
            } catch (e) {}
          } else {
            if (line === '[DONE]') {
              const msgLine = lines[i - 1];
              const msg = JSON.parse(msgLine.trim());
              const msgText = msg.message.content.parts[0];
              // console.log('[DONE]', msgText);
              this.reply(ChatGptStreamStatus.ChatGptStreamStatus_DONE, msgText);
              return;
            }
          }
        });
        if (this.part) {
          this.index++;
          this.reply(ChatGptStreamStatus.ChatGptStreamStatus_GOING, this.index + '_' + this.part);
        }
      }
    }
  }

  onError(err: string) {
    this.reply(ChatGptStreamStatus.ChatGptStreamStatus_ERROR, err);
  }
  handleWebChatGptMsg({ text, index, state }: { text: string; index: number; state: string }) {
    console.log({ text, index, state });
    switch (state) {
      case 'ERROR':
        this.reply(ChatGptStreamStatus.ChatGptStreamStatus_ERROR, text);
        break;
      case 'START':
        this.reply(ChatGptStreamStatus.ChatGptStreamStatus_START, '...');
        break;
      case 'IN_PROCESS':
        this.onData(text);
        break;
    }
  }
}
