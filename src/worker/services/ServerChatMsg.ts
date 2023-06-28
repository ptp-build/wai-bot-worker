import { currentTs } from '../utils/utils';
import { UserIdFirstBot } from '../../setting';
import BaseObject from './BaseObject';
import ServerSession from './ServerSession';
import ServerChatConfig from './ServerChatConfig';
import ServerChatAiMsg from './ServerChatAiMsg';
import ServerChatMsgStorage from './ServerChatMsgStorage';
import { CallbackButtonAction, NewMessage } from '../../types';
import MsgHelper from '../../masterChat/MsgHelper';
import UserMsgTable from '../models/mysql/UserMsgTable';
import TaskTable from '../models/mysql/TaskTable';

export default class ServerChatMsg extends BaseObject{
  private isMasterBot: boolean;
  private chatId: string;
  private localMsgId?: number;
  constructor(session:ServerSession,chatId:string,localMsgId?:number) {
    super(session)
    this.chatId = chatId
    this.localMsgId =localMsgId
    this.isMasterBot = chatId === UserIdFirstBot
  }
  getChatId(){
    return this.chatId
  }

  getLocalMsgId(){
    return this.localMsgId
  }

  async genMsgId(){
    const userId = this.getSession()!.getUserId()
    const msgId = await new UserMsgTable().genMsgId(Number(userId))
    console.debug("[genMsgId]",userId,msgId)
    return msgId
  }

  async replyText(text:string, inlineButtons?: object[][]){
    return {
      localMsgId:this.localMsgId,
      msgId:this.localMsgId ? await this.genMsgId() : undefined,
      newMessage:{
        msgId:await this.genMsgId(),
        text,
        chatId:this.chatId,
        inlineButtons
      }
    }
  }

  async askChatGptMessage(text:string){
    const aiMsgId = await this.genMsgId()
    const newMessage = this.formatNewMessage({
      msgId:aiMsgId,
      text:"...",
      senderId:this.getChatId(),
    })

    await this.handleNewMessage(newMessage)
    console.log("askChatGptMessage",text)
    await this.pushChatGtpAskQueue(text,aiMsgId,newMessage.msgDate!);
    return {newMessage}
  }
  async pushChatGtpAskQueue(text:string,aiMsgId:number,msgDate:number){
    const chatId = this.getChatId()
    const taskId = await new TaskTable().save({
      userId:this.getSession().getUserId()!,
      chatId:Number(this.getChatId()),
      isGoing: false,
      isDone: false,
      isError: false,
      msgDate: msgDate,
      msgId: aiMsgId
    })
    if(!taskId){
      throw new Error("task gen error");
    }else{
      await new ServerChatAiMsg(this.getSession(),chatId).pushToQueue({
        taskId,msgId:aiMsgId,text,msgDate
      })
    }
  }
  async handleNewMessage(newMessage:NewMessage){
    await new ServerChatMsgStorage(this.getSession(),this.getChatId()).addNewMessage(newMessage)
  }
  formatNewMessage(msg:Partial<NewMessage>){
    return {
      chatId:this.getChatId(),
      entities:[],
      inlineButtons:[],
      isOutgoing:false,
      senderId:"1",
      msgDate:currentTs(),
      ...msg
    } as NewMessage
  }
  async sendMessage(payload: {localMsgId:number,chatId:string,text:string}) {
    const aiChatMsg = new ServerChatAiMsg(this.getSession(),this.getChatId())
    const askMsgId = await new ServerChatMsg(this.getSession(),payload.chatId).genMsgId();
    let sendingState : 'messageSendingStatePending' | 'messageSendingStateFailed';

    if(await aiChatMsg.isAsking()){
      sendingState = 'messageSendingStateFailed'
      return {msgId:askMsgId,sendingState,newMessage:this.formatNewMessage({
          text:"Busy! retry later",
          senderId:this.getChatId(),
          msgId:await new ServerChatMsg(this.getSession(),payload.chatId).genMsgId(),
          inlineButtons:[
            [
              MsgHelper.buildCallBackAction("Cancel",CallbackButtonAction.Local_cancelMessage)
            ]
          ]
        })};
    }
    const newMessage = this.formatNewMessage({
      msgId:askMsgId,
      text:payload.text
    })
    await this.handleNewMessage(newMessage)
    const isEnableMultipleQuestion = await new ServerChatConfig(this.getSession(),this.getChatId()).isEnableMultipleQuestion();
    console.log({isEnableMultipleQuestion})

    if(isEnableMultipleQuestion){
      await aiChatMsg.addAskList(askMsgId)
      sendingState = 'messageSendingStatePending'
      return {msgId:askMsgId,sendingState};
    }else{
      const {newMessage} = await this.askChatGptMessage(payload.text)
      await aiChatMsg.save(askMsgId,newMessage.msgId)
      return {msgId:askMsgId,localMsgId:payload.localMsgId,sendingState:undefined,newMessage};
    }
  }

  async sendMultipleQuestion(payload: any) {
    const aiChatMsg = new ServerChatAiMsg(this.getSession(),this.getChatId())
    const isEnableMultipleQuestion = await new ServerChatConfig(this.getSession(),this.getChatId()).isEnableMultipleQuestion();
    if(!isEnableMultipleQuestion){
      const askMsgId = await new ServerChatMsg(this.getSession(),payload.chatId).genMsgId();

      return {
        msgId:askMsgId,
        text:"Sorry,please send /multipleQuestions enable multiple questioning first"
      }
    }else{
      let sendingState : 'messageSendingStatePending' | 'messageSendingStateFailed';
      if(await aiChatMsg.isAsking()){
        const askMsgId = await new ServerChatMsg(this.getSession(),payload.chatId).genMsgId();
        sendingState = 'messageSendingStateFailed'
        return {msgId:askMsgId,sendingState,newMessage:this.formatNewMessage({
            text:"Busy! retry later",
            senderId:this.getChatId(),
            msgId:await new ServerChatMsg(this.getSession(),payload.chatId).genMsgId(),
            inlineButtons:[
              [
                MsgHelper.buildCallBackAction("Cancel",CallbackButtonAction.Local_cancelMessage)
              ]
            ]
          })};
      }
      const msgIds = []
      const msgList = await aiChatMsg.getAskList()
      let text = ""
      const chatMsgStorage = new ServerChatMsgStorage(this.getSession(),this.getChatId())
      for (let i = 0; i < msgList.length; i++) {
        const id = msgList[i]
        msgIds.push(id)
        const m = await chatMsgStorage.getRow(id)
        if(m){
          text += m.text+"\n"
        }
      }
      if(msgIds.length > 0){
        const {newMessage} = await this.askChatGptMessage(text);
        for (let i = 0; i < msgList.length; i++) {
          const askMsgId = msgList[i]
          await aiChatMsg.save(askMsgId,newMessage.msgId)
        }
        return {
          msgIds,newMessage
        }
      }else{
        const askMsgId = await new ServerChatMsg(this.getSession(),payload.chatId).genMsgId();
        return {
          msgId:askMsgId,
          text:"Please type message"
        }
      }
    }
  }
}
