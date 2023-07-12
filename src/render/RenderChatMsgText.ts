import { currentTs } from '../sdk/common/time';
import ChatAiMsg from '../window/ChatAiMsg';
import RenderChatMsg from './RenderChatMsg';
import ChatGptCommand from './commands/ChatGptCommand';
import BridgeWorkerWindow from '../sdk/bridge/BridgeWorkerWindow';
import RenderGroupChatMsg from './RenderGroupChatMsg';
import BridgeMasterWindow from '../sdk/bridge/BridgeMasterWindow';
import MsgHelper from '../sdk/helper/MsgHelper';
import { CallbackButtonAction } from '../sdk/types';
import RenderCallbackButton from './RenderCallbackButton';

export default class RenderChatMsgText extends RenderChatMsg{

  private chatAiMsg: ChatAiMsg;
  constructor(chatId:string,localMsgId?:number,botId?:string) {
    super(chatId,localMsgId,botId);
    this.chatAiMsg = new ChatAiMsg(chatId)
  }

  async resendAiMsg(msgId:number){
    const chatId = this.getChatId()
    const chatAiMsg = new ChatAiMsg(chatId)
    // const mainChatMsgStorage = new MainChatMsgStorage()
    // const aiMsgId = await chatAiMsg.get(msgId);
    // const msgListTmp = await chatAiMsg.getAskList();
    // console.debug("resendAiMsg",{msgId,aiMsgId,msgListTmp})
    // if(aiMsgId && !msgListTmp.includes(msgId)){
    //   const msg = await mainChatMsgStorage.getRow(chatId,msgId)
    //   const aiMsg = await mainChatMsgStorage.getRow(chatId,aiMsgId)
    //   if(aiMsg && msg && msg.text){
    //     let text = "";
    //     const enableMultipleQuestion = await ChatConfig.isEnableMultipleQuestion(chatId)
    //     if(enableMultipleQuestion){
    //       const preAiMsgList = await chatAiMsg.getAskListFinished(aiMsg.msgId)
    //       if(preAiMsgList.length > 0){
    //         for (let i = 0; i < preAiMsgList.length; i++) {
    //           const aiMsg1 = await mainChatMsgStorage.getRow(chatId,preAiMsgList[i])
    //           if(aiMsg1 && aiMsg1.text){
    //             text += aiMsg1.text + "\n"
    //           }
    //         }
    //         text = text.trim()
    //       }
    //     }else{
    //       const aiMsg1 = await mainChatMsgStorage.getRow(chatId,msgId)
    //       if(aiMsg1 && aiMsg1.text){
    //         text += aiMsg1.text
    //       }
    //     }
    //     if(text){
    //       await this.invokeAskChatGptMsg(text,aiMsg)
    //       await this.handleUpdateMessage({
    //         ...aiMsg,
    //         text:"..."
    //       })
    //       await this.handleUpdateMessage({
    //         ...msg,
    //         inlineButtons:[]
    //       })
    //     }
    //   }
    // }
  }
  async preProcessMessage(text:string){
    let stop = false
    if(text.startsWith("-")){
      const t = text.split(" ")
      const cmd = t[0] as string
      if(cmd !== "o"){
        const offline = await this.checkWorkerIsOffline(this.getBotId())
        if(offline){
          return offline
        }
      }
      switch (cmd.toLowerCase().substring(1)){
        case "o":
          await RenderCallbackButton.invokeMasterWindowCallbackButton(CallbackButtonAction.Master_OpenWorkerWindow,{botId:this.getBotId(),chatId:this.getChatId()})
          stop = true
          break
        case "l":
          if(t.length > 1){
            await new BridgeWorkerWindow(this.getBotId()).loadUrl({url:t[1]})
            stop = true
          }
          break
        case "b":
          await new BridgeWorkerWindow(this.getBotId()).goBack()
          stop = true
          break
        case "h":
          const account = await this.getWorkerAccount()
          if(account.type === "chatGpt"){
            account.customWorkerUrl = "https://chat.openai.com"
          }
          await new BridgeWorkerWindow(this.getBotId()).loadUrl({url:account.customWorkerUrl!})
          stop = true
          break
        case "r":
          await new BridgeWorkerWindow(this.getBotId()).reload()
          stop = true
          break
        case "rr":
          await new BridgeMasterWindow(this.getBotId()).restartWorkerWindow({botId:this.getBotId()})
          stop = true
          break
        case "c":
          await new BridgeMasterWindow(this.getBotId()).closeWorkerWindow({botId:this.getBotId()})
          stop = true
          break
        case "d":
          await new BridgeWorkerWindow(this.getBotId()).showDevTools()
          stop = true
          break
        case "a":
          await new BridgeWorkerWindow(this.getBotId()).activeWindow(this.getBotId())
          stop = true
          break
      }
    }
    if(stop){
      const msgId = await this.genMsgId()
      return {msgId,sendingState:undefined}
    }else{
      return false
    }
  }
  async askChatGpt(msgId:number,text:string){
    const workerAccount = await this.getWorkerAccount()

    let inlineButtons = []
    if(await new ChatGptCommand(this.getChatId()).isSetupChatGptRole()){
      await new ChatGptCommand(this.getChatId()).cancelSetupChatGptRole()
      inlineButtons.push([MsgHelper.buildCallBackAction(
        "保存角色信息",
        CallbackButtonAction.Render_setupChatGptRoleConfirm,
        {
          cancelInlineButtons:true,
          text
        }
      )])
      inlineButtons.push(MsgHelper.buildLocalCancel())
    }else{
      const promptFormat = workerAccount ? workerAccount.promptFormat : ""
      if(promptFormat){
        text = promptFormat.replace("${prompts}",text)
      }
    }
    await this.askChatGptMessage(text)
    return {msgId,sendingState:undefined,inlineButtons}
  }
  async processMessage({text,entities,taskId}:{text:string,entities?:any[],taskId?:number}){
    const group = await this.getGroup()
    if(group){
      return new RenderGroupChatMsg(this.getChatId(),this.getLocalMsgId()).handleGroupMsg({text,entities,taskId})
    }

    const workerAccount = await this.getWorkerAccount()
    const preRes = await this.preProcessMessage(text)
    if(preRes){
      return preRes
    }
    const offline = await this.checkWorkerIsOffline(this.getBotId())
    if(offline){
      return offline
    }
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
        case "chatGpt":
          return this.askChatGpt(msgId,text)
        case "bot":
          if(workerAccount.type === 'bot' && workerAccount.botType === 'chatGptBot'){
            return this.askChatGpt(msgId,text)
          }
          break
      }
      await new BridgeWorkerWindow(this.getChatId()).sendChatMsgToWorker({
        chatId:this.getChatId(),
        text,
      })
      return {msgId,sendingState:undefined}
    }
  }
}
