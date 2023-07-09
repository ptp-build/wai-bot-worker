import RenderChatMsg from './RenderChatMsg';
import ChatAiMsg from '../window/ChatAiMsg';
import WorkerAccount from '../window/woker/WorkerAccount';
import { ChatMsgRenderResponse, LocalWorkerAccountType } from '../sdk/types';
import { currentTs } from '../sdk/common/time';
import BridgeWorkerWindow from '../sdk/bridge/BridgeWorkerWindow';
import RenderChatMsgCommand from './RenderChatMsgCommand';

export default class RenderGroupChatMsg extends RenderChatMsg{
  constructor(chatId:string,localMsgId?:number) {
    super(chatId,localMsgId);
  }
  async sendMessageToWorker(account:LocalWorkerAccountType,{text,entities,taskId}:{text:string,entities?:any[],taskId?:number}):Promise<ChatMsgRenderResponse> {
    const { botId,type,username } = account
    const offline = await this.checkWorkerIsOffline(botId)
    if(offline){
      return offline
    }
    const msgId = await this.genMsgId()

    if(text.startsWith("@")){
      text = text.replace(`@${username}`,"")
      text = text.trim()
    }
    switch (type){
      case "chatGpt":
        if(!text){
          break
        }
        break
      default:
        break
    }

    await new BridgeWorkerWindow(botId).sendChatMsgToWorker({
      text,
      chatId:this.getChatId(),
    })
    return { msgId, sendingState: undefined }
  }
  async handleMentionGroupMsg({text,entities,taskId}:{text:string,entities?:any[],taskId?:number},entity:any){
    const {userId} = entity
    const worker = await new WorkerAccount(userId).get()
    return await this.sendMessageToWorker(worker as LocalWorkerAccountType,{text,entities,taskId})
  }

  async handleCommandGroupMsg({text,entities,taskId}:{text:string,entities?:any[],taskId?:number},entity:any){
    const [command,username] = text.substring(entity.offset,entity.length).split("@")
    const {chatInfoFull} = await this.getGroup()
    const {members} = chatInfoFull
    for (let i = 0; i < members.length; i++) {
      const {userId} = members[i]
      const worker = await new WorkerAccount(userId).get()
      if(worker.username === username){
        return await new RenderChatMsgCommand(this.getChatId(),this.getLocalMsgId(),userId).processBotCommand(command.substring(1))
      }
    }
    const msgId = await this.genMsgId()
    return {msgId,sendingState:undefined,newMessage:{
        text:"no worker found",
      }
    }
  }
  async handleGroupMsg({text,entities,taskId}:{text:string,entities?:any[],taskId?:number}){
    if(entities && entities.length > 0){
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
            return await this.sendMessageToWorker(account as LocalWorkerAccountType,{text,entities,taskId})
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

}
