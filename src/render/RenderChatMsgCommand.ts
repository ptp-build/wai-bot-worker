import RenderChatMsg from './RenderChatMsg';
import MsgHelper from '../sdk/helper/MsgHelper';
import ChatConfig from '../window/ChatConfig';
import ChatAiMsg from '../window/ChatAiMsg';
import CodingCommand from './commands/CodingCommand';
import CustomWorkerCommand from './commands/CustomWorkerCommand';
import ChatGptCommand from './commands/ChatGptCommand';
import MasterCommand from './commands/MasterCommand';
import { MasterBotId } from '../sdk/setting';

export default class RenderChatMsgCommand extends RenderChatMsg{
  private isMasterChat: boolean;
  constructor(chatId:string,localMsgId?:number) {
    super(chatId,localMsgId);
    this.isMasterChat = this.getChatId() === MasterBotId
  }

  async loadBotCommands(){
    if(!this.getChatId()){
      return []
    }
    if(this.isMasterChat){
      return new MasterCommand(this.getChatId()).loadBotCommands()
    }
    const workerAccount = await this.getWorkerAccount()
    if(workerAccount){
      const {type} = workerAccount
      switch (type){
        case "chatGpt":
          return new ChatGptCommand(this.getChatId(),this.getLocalMsgId()).loadBotCommands()
        case "custom":
          return new CustomWorkerCommand(this.getChatId(),this.getLocalMsgId()).loadBotCommands()
        case "coding":
          return new CodingCommand(this.getChatId(),this.getLocalMsgId()).loadBotCommands()
      }
    }
    const cmdList = [
      ["start","Start conversation."],
    ]
    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }

  async enableMultipleQuestion(command:string){
    const chatId = this.getChatId()
    const msgId = await new RenderChatMsg(chatId).genMsgId()
    await new ChatConfig(chatId).setConfig("enableMultipleQuestion",command === "disableMultipleQuestions" ? "false" : "true")
    if(command === "disableMultipleQuestions"){
      await new ChatAiMsg(chatId).deleteAskList()
      return {
        msgId,
        text:`Multiple lines of questioning is Disable`,
        commands:await new ChatGptCommand(this.getChatId(),this.getLocalMsgId()).loadBotCommands()
      }
    }else{
      return {
        msgId,
        text:`Multiple lines of questioning is Enabled.Type /send to finish question.`,
        commands:await new ChatGptCommand(this.getChatId(),this.getLocalMsgId()).loadBotCommands()
      }
    }
  }
  async processBotCommand(command:string){
    const workerAccount = await this.getWorkerAccount()
    if(workerAccount){
      if(workerAccount.type === "coding"){
        return new CodingCommand(this.getChatId(),this.getLocalMsgId()).processBotCommand(command)
      }
      if(workerAccount.type === "custom"){
        return new CustomWorkerCommand(this.getChatId(),this.getLocalMsgId()).processBotCommand(command)
      }
      if(workerAccount.type === "chatGpt"){
        return new ChatGptCommand(this.getChatId(),this.getLocalMsgId()).processBotCommand(command)
      }
    }
    return new MasterCommand(this.getChatId(),this.getLocalMsgId()).processBotCommand(command)
  }
}
