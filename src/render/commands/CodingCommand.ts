import RenderChatMsg from '../RenderChatMsg';
import MsgHelper from '../../masterChat/MsgHelper';
import { CallbackButtonAction } from '../../types';
import { fileExists, getFileContent } from '../../worker/utils/file';
import KvCache from '../../worker/services/kv/KvCache';
import MainChatMsgStorage from '../../window/MainChatMsgStorage';
import BaseCommand from './BaseCommand';

export default class CodingCommand extends BaseCommand{

  constructor(chatId:string,localMsgId?:number) {
    super(chatId,localMsgId);}

  async loadBotCommands(){
    const cmdList = [
      ["start","Start conversation."],
      ["control","Control Panel"],
      ["setting","Setting panel"],
      ["open","Open A file with /open {filePath}"],
      ["clearHistory","Clear chat History."]
    ]
    console.log(cmdList)

    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }

  async start(){
    return super.start()
  }

  async open(){
    return this.replyText("pls type: /open {file_path}",[
      MsgHelper.buildLocalCancel()
    ])
  }

  async action(action?:"reloadWindow" | "openWindow"){
    return super.action(action)
  }

  async setting(){
    const {projectRootDir} = await this.getWorkerAccount()
    let helper = "Setting panel:"
    helper += `projectRootDir: ${projectRootDir || "no value"}`
    const buttons = this.getSettingButtons()
    buttons.push([
      MsgHelper.buildCallBackAction("Project Root Dir",CallbackButtonAction.Local_setupProjectRootDir),
    ])

    buttons.push([
      MsgHelper.buildCallBackAction("↩️️ Cancel",CallbackButtonAction.Local_cancelMessage),
    ])
    return this.replyText(helper,buttons)
  }

  async handleMessageText(text:string,msgId?:number){
    if(!msgId){
      msgId = await this.genMsgId()
    }

    if(text.startsWith("/open ")){
      text = text.split("/open")[1].trim()

      if(text){
        if(await fileExists(text)){
          const content = await getFileContent(text)
          console.log(content!.toString())
          const fileContent = content!.toString();
          const msgId = await this.replyNewMessage(
            text+":\n"+MsgHelper.formatCodeTextMsg(fileContent,"typescript"),
            [
              MsgHelper.buildLocalCancel()
            ]
          )
          await KvCache.getInstance().put(`open_file_msg_${this.getChatId()}`,msgId.toString())
          await KvCache.getInstance().put(`open_file_msg_send_${this.getChatId()}`,false)
        }else{
          await this.replyNewMessage(
            text+": not exists",
            [
              MsgHelper.buildLocalCancel()
            ]
          )
        }
      }
      return {msgId,sendingState:undefined}
    }else{
      let aiMsgIdId = await KvCache.getInstance().get(`open_file_msg_${this.getChatId()}`);
      if(aiMsgIdId){
        const msg = await new MainChatMsgStorage().getRow(this.getChatId(),aiMsgIdId)
        if(!await KvCache.getInstance().get(`open_file_msg_send_${this.getChatId()}`)){
          text = msg.text + text
          await KvCache.getInstance().put(`open_file_msg_send_${this.getChatId()}`,true)
        }
      }
      await this.askChatGptMessage(text)
      return {msgId,sendingState:undefined}
    }
  }

  async processBotCommand(command:string){
    const ack = super.processBotCommand(command)
    switch (command) {
      case "open":
        return await this.open()
    }
    return ack
  }
}
