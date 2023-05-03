import {parseAppArgs } from '../../../utils/args';
import PyAutoGuiRpa from '../../PyAutoGuiRpa';
import BotWebSocket from '../../BotWebSocket';
import { ChatGptStreamStatus, MsgAction } from '../../../../lib/ptp/protobuf/PTPCommon/types';
import { sleep } from '../../../../worker/share/utils/utils';
import { encodeToBase64 } from '../../../utils/utils';
import ChatGptHelper from './ChatGptHelper';
import { ChatGptMsgProcessor } from './ChatGptMsgProcessor';
import MainWindowManager from '../../../ui/MainWindowManager';

let __workers = new Map<string, ChatGpWorker>();
export enum BotStateType {
  WAITING,
  READY

}
export class ChatGpWorker {
  private botId: string;
  private helper: ChatGptHelper;
  private status?: ChatGptStreamStatus;
  private msgProcessor:ChatGptMsgProcessor;
  private botState:BotStateType
  constructor(botId:string) {
    this.botId = botId
    this.botState = BotStateType.WAITING
    this.status = ChatGptStreamStatus.ChatGptStreamStatus_WAITING;
    this.helper = new ChatGptHelper()
    this.msgProcessor = new ChatGptMsgProcessor(this)
  }

  static getInstance(botId: string) {
    if(!__workers.has(botId)){
      __workers.set(botId,new ChatGpWorker(botId))
    }
    return __workers.get(botId)!;
  }
  getMainWindow(){
    return MainWindowManager.getInstance(this.botId)!
  }
  getMsgProcessor(){
    return this.msgProcessor
  }
  getBotId(){
    return this.botId
  }
  setState(status: ChatGptStreamStatus) {
    this.status = status;
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
          );
          this.waitForStatus(state, timeout, startTime).then(resolve).catch(console.error);
        }
      }, timeout_);
    });
  }

  clickLogin(payload:{x:number,y:number}){
    console.log("[clickLogin]",payload)
    const [appPosX,appPosY] = this.getMainWindow().getMainWindow().getPosition();

    PyAutoGuiRpa.runPyCode([
      {
        cmd:"click",
        x:payload.x + 10 + appPosX,
        y:payload.y + 10 + 53 + appPosY
      },
    ])
  }
  async cfChallenge(payload:{x:number,y:number}) {
    console.log("[cfChallenge]", payload)
  }
  async inputUsername(payload:{x:number,y:number}){
    console.log("[inputUsername]",payload)
    const [appPosX,appPosY] = this.getMainWindow().getMainWindow().getPosition();
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
  async inputPassword(payload:{x:number,y:number}){
    console.log("[inputPassword]",payload)
    const [appPosX,appPosY] = this.getMainWindow().getMainWindow().getPosition();
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
  async promptsInputReady(){
    console.log("[promptsInputReady]!!")
    await sleep(3000)
    this.askMsg("ping ,you reply:pong!!!!")
  }

  async inputPrompt(text:string){
    const dataEncode = encodeToBase64(text)
    await this.getMainWindow().runJsCode(`document.getElementById("prompt-textarea").value = decodeURIComponent(escape(atob("${dataEncode}")))`)
  }

  async askMsg(text:string){
    await this.inputPrompt(text);
    const [appPosX,appPosY] = this.getMainWindow().getMainWindow().getPosition();
    const [_,appHeight] = this.getMainWindow().getMainWindow().getSize();
    const {chatGptSendPromptSleep} = parseAppArgs()
    const inputPostX= 20 + appPosX + 4
    const inputPostY= appHeight - 65 + appPosY - 25
    console.log("[askMsg]",{appPosX,appPosY,appHeight,inputPostX,inputPostY})
    await PyAutoGuiRpa.runPyCode([
      {
        cmd: 'sleep',
        sec: chatGptSendPromptSleep || 0,
      },
      {
        cmd:"click",
        x:appPosX + 74,
        y:appPosY + 78 - 25
      },
      {
        cmd:"click",
        x:inputPostX,
        y:inputPostY
      },
      {
        cmd:"press",
        key:"enter"
      },
      {
        cmd: 'press',
        key: 'backspace',
      },

      {
        cmd: 'press',
        key: 'tab',
      },
      {
        cmd: 'press',
        key: 'enter',
      },
      // {
      //   cmd: 'hotkey',
      //   keys: platform === 'win32' ? ['ctrl', 'enter'] : ['command', 'enter'],
      // },
    ])
  }

  async recvMsg(payload:any){
    const { text, index, state } = payload;
    if(this.botState === BotStateType.WAITING){
      if(text && text.toLowerCase().includes("done")){
        this.botState = BotStateType.READY
        return BotWebSocket.msgReq(MsgAction.MsgAction_WaiChatGptPromptsInputReady,{
          botId:this.getBotId()
        }).catch(console.error)
      }
    }
    if(this.botState === BotStateType.READY){

      switch (state){
        case "START":
          this.msgProcessor.onStart()
          break
        case "ERROR":
          this.msgProcessor.onError(text)
          break
        default:
          const res = this.helper.parseOnData(text,index)
          if(res.state === 'DONE'){
            this.msgProcessor.reply(ChatGptStreamStatus.ChatGptStreamStatus_DONE,res.text)
          }
          if(res.state === 'GOING'){
            this.msgProcessor.reply(ChatGptStreamStatus.ChatGptStreamStatus_GOING,res.text)
          }
          break
      }
    }

  }
}
