import { ChatGptStreamStatus, MsgAction } from '../../../lib/ptp/protobuf/PTPCommon/types';
import { Pdu } from '../../../lib/ptp/protobuf/BaseMsg';
import { SendBotMsgReq } from '../../../lib/ptp/protobuf/PTPMsg';
import BotWebSocket from '../BotWebSocket';
import WaiBotRpa from '../WaiBotRpa';
import { parseAppArgs } from '../../utils/args';
import PyAutoGuiRpa from '../PyAutoGuiRpa';
import { runJsCode } from '../../index';
import ChatGptHelper from '../../../worker/helper/ChatGptHelper';

let msgList: number[] = [];
let accountIds: number[] = [];
let msgObjects: Record<number, ChatGptWaiChatBot> = {};

let tempTexts = "";
let sendIndex = 0;
let tempLastText = "";
let currentMsgId: number = 0;
let currentObj:ChatGptWaiChatBot | null = null

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
  static getAccountIds(){
    return accountIds
  }
  static setAccountIds(accountIds_:number[]){
    accountIds = accountIds_
  }
  async process() {
    currentObj = this
    await this.askChatGpt();
  }

  async askChatGpt() {
    let { text, msgId } = this;
    try {
      currentMsgId = msgId;
      console.log(
        'askChatGpt',
        text,
        msgId
      );
      await new WaiBotRpa().askMsg(text)
      // WaiBridge.postEvent('WRITE_INPUT', { text: text });
      // await this.waitForStatus(ChatGptStreamStatus.ChatGptStreamStatus_DONE);
    } catch (e) {
      ChatGptWaiChatBot.reply(ChatGptStreamStatus.ChatGptStreamStatus_ERROR, 'ERROR askMsg');
      console.error(e);
    }
  }
  static getCurrentMsgId() {
    return currentMsgId;
  }
  static getCurrentObj() {
    return currentObj
  }
  setState(status: ChatGptStreamStatus) {
    this.status = status;
  }

  static reply(status: ChatGptStreamStatus, text?: string) {
    const obj = ChatGptWaiChatBot.getCurrentObj()
    if(!obj) return
    obj.setState(status);
    // console.log('[ChatGptWaiChatBot reply]', status, text);
    let { chatId, msgId, msgDate, msgAskId, msgAskDate, senderId } = obj;
    BotWebSocket.getCurrentInstance().sendWithQueue(
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
    )
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
    ChatGptWaiChatBot.reply(ChatGptStreamStatus.ChatGptStreamStatus_START, '...');
  }

  onError(err: string) {
    ChatGptWaiChatBot.reply(ChatGptStreamStatus.ChatGptStreamStatus_ERROR, err);
  }

  static clickLogin(payload:{x:number,y:number}){
    console.log("[clickLogin]",payload)
    const {appPosY,appPosX} = parseAppArgs()

    PyAutoGuiRpa.runPyCode([
      {
        cmd:"click",
        x:payload.x + 10 + appPosX,
        y:payload.y + 10 + 53 + appPosY
      },
    ])
  }
  static async inputUsername(payload:{x:number,y:number}){
    console.log("[inputUsername]",payload)
    const {appPosY,appPosX} = parseAppArgs()
    console.debug(parseAppArgs().chatGptUsername)
    if(!parseAppArgs().chatGptUsername) return
    runJsCode(`$("#username").val("${parseAppArgs().chatGptUsername}")`)
    await PyAutoGuiRpa.runPyCode([
      {
        cmd:"sleep",
        sec:0.5
      },
      {
        cmd:"click",
        x:payload.x + 10 + appPosX,
        y:payload.y + 10 + 53 + appPosY
      },
      {
        cmd:"press",
        key:"tab"
      },
      {
        cmd:"press",
        key:"enter"
      },
    ])
  }
  static async inputPassword(payload:{x:number,y:number}){
    console.log("[inputPassword]",payload)
    console.debug(parseAppArgs().chatGptPassword)
    if(!parseAppArgs().chatGptPassword) return
    const {appPosY,appPosX} = parseAppArgs()
    runJsCode(`$("#password").val("${parseAppArgs().chatGptPassword}")`)
    await PyAutoGuiRpa.runPyCode([
      {
        cmd:"sleep",
        sec:0.5
      },
      {
        cmd:"click",
        x:payload.x + 10 + appPosX,
        y:payload.y + 10 + 53 + appPosY
      },
      {
        cmd:"press",
        key:"tab"
      },
      {
        cmd:"press",
        key:"tab"
      },
      {
        cmd:"press",
        key:"tab"
      },
      {
        cmd:"press",
        key:"enter"
      },
    ])
  }
  static promptsInputReady(){
    BotWebSocket.msgReq({
      action:MsgAction.MsgAction_WaiChatGptPromptsInputReady
    }).catch(console.error)
  }
  static handleWebChatGptMsg({ id,text, index, state }: { id:number,text: string; index: number; state: string }) {
    switch (state) {
      case 'ERROR':
        tempTexts = ""
        tempLastText = ""
        sendIndex = 0
        console.log({ text, index, state });
        ChatGptWaiChatBot.reply(ChatGptStreamStatus.ChatGptStreamStatus_ERROR, text);
        return;
      case 'START':
        tempTexts = ""
        tempLastText = ""
        sendIndex = 0
        console.log({ text, index, state });
        ChatGptWaiChatBot.reply(ChatGptStreamStatus.ChatGptStreamStatus_START, '...');
        return;
    }
    const res = ChatGptHelper.getInstance(id).parseOnData(text,index)
    if(res.state !== 'ERROR'){
      ChatGptWaiChatBot.reply(
        res.state === "DONE" ?
          ChatGptStreamStatus.ChatGptStreamStatus_DONE:
          ChatGptStreamStatus.ChatGptStreamStatus_GOING
        , res.text);
    }
  }

  static onData(chunk: string,index:number) {
    // console.log(index)
    // putFileContent(`/tmp/test/${index}`,chunk)
    tempTexts += chunk;
    const dataText = "\n\n"+tempTexts.trim()
    const rows = dataText.split("\n\ndata: {\"message\": {\"id\":")
    let lastLine = rows[rows.length - 1]
    let isDone = false
    if(lastLine.endsWith("\n\ndata: [DONE]")){
      lastLine = lastLine.substring(0,lastLine.length - "\n\ndata: [DONE]".length )
      isDone = true
    }else{
      if(!lastLine.endsWith('"error": null}')){
        lastLine = rows[rows.length - 2]
      }
    }
    lastLine = "{\"message\": {\"id\":" + lastLine
    try{
      const res = JSON.parse(lastLine)
      const text1 = res.message.content.parts[0];
      const text = text1.replace(tempLastText,"")
      tempLastText = text1

      sendIndex += 1
      if(isDone){
        if(tempLastText && tempLastText.toLowerCase().includes("pong")){
          ChatGptWaiChatBot.promptsInputReady();
        }
        console.log("[onData] #" + sendIndex,"DONE",tempLastText)
        ChatGptWaiChatBot.reply(ChatGptStreamStatus.ChatGptStreamStatus_DONE, sendIndex+"_"+tempLastText);
        sendIndex = 0
      }else{
        console.log("[onData] #" + sendIndex,"GOING",text)
        ChatGptWaiChatBot.reply(ChatGptStreamStatus.ChatGptStreamStatus_GOING, sendIndex+"_"+text);
      }
    }catch (e){
      // putFileContent(`/tmp/test/${index}`,chunk).then(console.log).catch(console.error)
      // console.log("[onData] #" + index,"EROR")
    }
  }
}
