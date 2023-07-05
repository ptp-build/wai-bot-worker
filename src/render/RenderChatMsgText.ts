import { currentTs } from '../sdk/common/time';
import ChatAiMsg from '../window/ChatAiMsg';
import ChatConfig from '../window/ChatConfig';
import MainChatMsgStorage from '../window/MainChatMsgStorage';
import CodingCommand from './commands/CodingCommand';
import RenderChatMsg from './RenderChatMsg';
import ChatGptCommand from './commands/ChatGptCommand';
import BridgeWorkerWindow from '../sdk/bridge/BridgeWorkerWindow';

export default class RenderChatMsgText extends RenderChatMsg{

  private chatAiMsg: ChatAiMsg;
  constructor(chatId:string,localMsgId?:number) {
    super(chatId,localMsgId);
    this.chatAiMsg = new ChatAiMsg(chatId)
  }

  async resendAiMsg(msgId:number){
    const chatId = this.getChatId()
    const chatAiMsg = new ChatAiMsg(chatId)
    const mainChatMsgStorage = new MainChatMsgStorage()
    const aiMsgId = await chatAiMsg.get(msgId);
    const msgListTmp = await chatAiMsg.getAskList();
    console.debug("resendAiMsg",{msgId,aiMsgId,msgListTmp})
    if(aiMsgId && !msgListTmp.includes(msgId)){
      const msg = await mainChatMsgStorage.getRow(chatId,msgId)
      const aiMsg = await mainChatMsgStorage.getRow(chatId,aiMsgId)
      if(aiMsg && msg && msg.text){
        let text = "";
        const enableMultipleQuestion = await ChatConfig.isEnableMultipleQuestion(chatId)
        if(enableMultipleQuestion){
          const preAiMsgList = await chatAiMsg.getAskListFinished(aiMsg.msgId)
          if(preAiMsgList.length > 0){
            for (let i = 0; i < preAiMsgList.length; i++) {
              const aiMsg1 = await mainChatMsgStorage.getRow(chatId,preAiMsgList[i])
              if(aiMsg1 && aiMsg1.text){
                text += aiMsg1.text + "\n"
              }
            }
            text = text.trim()
          }
        }else{
          const aiMsg1 = await mainChatMsgStorage.getRow(chatId,msgId)
          if(aiMsg1 && aiMsg1.text){
            text += aiMsg1.text
          }
        }
        if(text){
          await this.invokeAskChatGptMsg(text,aiMsg)
          await this.handleUpdateMessage({
            ...aiMsg,
            text:"..."
          })
          await this.handleUpdateMessage({
            ...msg,
            inlineButtons:[]
          })
        }
      }
    }
  }
  async processMessage({text,entities,taskId}:{text:string,entities?:any[],taskId?:number}){
    const workerAccount = await this.getWorkerAccount()
    const msgId = await this.genMsgId()
    await this.handleNewMessage({
      chatId:this.getChatId(),
      msgId,
      text,
      entities:entities||[],
      inlineButtons:[],
      isOutgoing:true,
      senderId:"1",
      msgDate:currentTs(),
    })
    if(workerAccount){
      switch (workerAccount.type){
        case "coding":
          return await new CodingCommand(this.getChatId(),this.getLocalMsgId()).handleMessageText(text)
        case "chatGpt":
          if(await new ChatGptCommand(this.getChatId()).isSetupChatGptRole()){
            await new ChatGptCommand(this.getChatId()).setupChatGptRoleText(text)
          }else{
            const promptFormat = workerAccount ? workerAccount.promptFormat : ""
            if(promptFormat){
              text = promptFormat.replace("${prompts}",text)
            }
          }

          if((workerAccount && workerAccount.type !== "chatGpt")){
            if(!taskId){
              return {msgId,sendingState:undefined}
            }
          }

          const enableMultipleQuestion = await ChatConfig.isEnableMultipleQuestion(this.getChatId())
          if(enableMultipleQuestion){
            await this.chatAiMsg.addAskList(msgId)
            return {msgId,sendingState:"messageSendingStatePending"}
          }else{
            const aiMsgId = await this.askChatGptMessage(text,taskId)
            await new ChatAiMsg(this.getChatId()).save(msgId,aiMsgId)
            return {aiMsgId,msgId,sendingState:undefined}
          }
        default:

          await new BridgeWorkerWindow(this.getChatId()).sendChatMsgToWorker({
            chatId:this.getChatId(),
            text,
          })

          return {msgId,sendingState:undefined}
      }
    }
  }
}
