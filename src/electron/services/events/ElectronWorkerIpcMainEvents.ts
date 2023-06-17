import { ChatGpWorker } from '../worker/chatGpt/ChatGpWorker';


export default class ElectronWorkerIpcMainEvents{
  private __id:number;
  private botId:string;
  constructor(botId:string,__id:number) {
    this.botId = botId;
    this.__id = __id;
  }
  async handleEvent(action:string,payload:any){
    const chatGptWorker = ChatGpWorker.getInstance(this.botId);
    switch (action) {
      case 'MsgAction_WaiChatGptBotWorkerInit':
        break;
      case 'MsgAction_WaiChatGptCfChallenge':
        chatGptWorker.cfChallenge(payload);
        break;
      case 'MsgAction_WaiChatGptInputUsername':
        chatGptWorker.inputUsername(payload);
        break;
      case 'MsgAction_WaiChatGptClickLogin':
        chatGptWorker.clickLogin(payload);
        break;
      case 'MsgAction_WaiChatGptInputPassword':
        chatGptWorker.inputPassword(payload);
        break;
      case "MsgAction_WaiChatGptPromptsInputReady":
        chatGptWorker.promptsInputReady()
        break
      case 'MsgAction_WaiChatGptOnRecvMsg':
        chatGptWorker.recvMsg(payload)
        break
    }
  }
}
