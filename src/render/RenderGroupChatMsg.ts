import RenderChatMsg from './RenderChatMsg';
import ChatAiMsg from '../window/ChatAiMsg';
import WorkerAccount from '../window/woker/WorkerAccount';
import { CallbackButtonAction, LocalWorkerAccountType } from '../sdk/types';
import BotWorkerStatus from '../sdk/botWorkerStatus/BotWorkerStatus';
import { currentTs } from '../sdk/common/time';
import BridgeWorkerWindow from '../sdk/bridge/BridgeWorkerWindow';
import MsgHelper from '../sdk/helper/MsgHelper';
import { parseMentionName } from '../sdk/common/tg-msg-text-parser';
import RenderChatMsgCommand from './RenderChatMsgCommand';
import worker from '../worker/worker_index';

export default class RenderGroupChatMsg extends RenderChatMsg{
  constructor(chatId:string,localMsgId?:number) {
    super(chatId,localMsgId);
  }
  async sendMessageToWorker(account:LocalWorkerAccountType,{text,entities,taskId}:{text:string,entities?:any[],taskId?:number}) {
    const { botId,type,username } = account
    if (!BotWorkerStatus.getIsReadyByBotId(botId)) {
      return false
    }
    const msgId = await this.genMsgId()
    switch (type){
      case "chatGpt":
        if(text.startsWith("@")){
          text = text.replace(`@${username}`,"")
          text = text.trim()
        }
        if(!text){
          break
        }
        const aiMsgId = await this.genMsgId()
        const msg = {
          chatId:this.getChatId(),
          msgId:aiMsgId,
          text:"...",
          entities:[],
          inlineButtons:[],
          isOutgoing:false,
          senderId:botId,
          msgDate:currentTs(),
        }
        await this.handleNewMessage(msg)
        await new BridgeWorkerWindow(botId).sendChatMsgToWorker({
          text,
          updateMessage:msg,
          fromBotId:this.getChatId(),
          taskId
        })

        await new ChatAiMsg(this.getChatId()).save(msgId, aiMsgId)
        break
    }
    return { msgId, sendingState: undefined }
  }
  async handleMentionGroupMsg({text,entities,taskId}:{text:string,entities?:any[],taskId?:number},entity:any){
    const {userId} = entity
    const worker = await new WorkerAccount(userId).get()
    return await this.sendMsgTextToWorker(worker as LocalWorkerAccountType,{text,entities,taskId})
  }

  async handleCommandGroupMsg({text,entities,taskId}:{text:string,entities?:any[],taskId?:number},entity:any){
    const [command,username] = text.substring(entity.offset,entity.length).split("@")
    const {chatInfoFull} = await this.getGroup()
    const {members} = chatInfoFull
    for (let i = 0; i < members.length; i++) {
      const {userId} = members[i]
      const worker = await new WorkerAccount(userId).get()
      if(worker.username === username){
        return await new RenderChatMsgCommand(userId,this.getLocalMsgId()).processBotCommand(command.substring(1))
      }
    }
    const msgId = await this.genMsgId()
    return {msgId,sendingState:undefined,newMessage:{
        text:"no worker found",
      }
    }
  }
  async handleGroupMsg({text,entities,taskId}:{text:string,entities?:any[],taskId?:number}){
    if(entities){
      const entity = entities.find(entity=>entity.offset === 0)
      switch (entity.type){
        case "MessageEntityBotCommand":
          return await this.handleCommandGroupMsg({text,entities},entity)
        case "MessageEntityMentionName":
          return await this.handleMentionGroupMsg({text,entities},entity)
      }
    }

    const {chatInfoFull} = await this.getGroup()
    const {adminMembersById} = chatInfoFull
    const adminMemberIds = Object.keys(adminMembersById)
    if(adminMemberIds.length > 0){
      for (let i = 0; i < adminMemberIds.length; i++) {
        const adminUserId = adminMemberIds[i]
        if(!adminUserId.startsWith("-")){
          const account = await new WorkerAccount(adminUserId).get()
          if(account){
            return await this.sendMsgTextToWorker(account as LocalWorkerAccountType,{text,entities,taskId})
          }
        }
      }
    }
    const msgId = await this.genMsgId()
    return {msgId,sendingState:undefined,newMessage:{
        text:"You should set a admin",
      }
    }
  }
  async sendMsgTextToWorker(account:LocalWorkerAccountType,{text,entities,taskId}:{text:string,entities?:any[],taskId?:number}) {
    const res = await this.sendMessageToWorker(account,{text,entities,taskId})
    if(!res){
      const msgId = !MsgHelper.isLocalMessageId(this.getLocalMsgId()!) ? this.getLocalMsgId() : await this.genMsgId()
      return {
        msgId,sendingState:"messageSendingStateFailed",
        inlineButtons:[
          [MsgHelper.buildCallBackAction("Resend",CallbackButtonAction.Local_resend)]
        ],
        newMessage:{
          msgId: await this.genMsgId(),
          text: `Worker is offline,Pls send /openWindow@${account.username} and resend`,
          inlineButtons:[
            MsgHelper.buildLocalCancel()
          ],
        }
      }
    }
    return res
  }
}
