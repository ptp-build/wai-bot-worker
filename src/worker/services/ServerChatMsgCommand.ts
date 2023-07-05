import ServerChatMsg from "./ServerChatMsg";
import ServerSession from "./ServerSession";
import ServerChatConfig from "./ServerChatConfig";
import MsgHelper from "../../masterChat/MsgHelper";
import {CallbackButtonAction, ServerCallbackButtonAction} from "../../types";
import ServerBotAccount from "./ServerBotAccount";
import { MasterBotId } from '../../setting';

export default class ServerChatMsgCommand extends ServerChatMsg {
  constructor(session:ServerSession,chatId: string, localMsgId?: number) {
    super(session,chatId, localMsgId);
  }

  async masterCommands() {
    const cmdList = [];
    cmdList.push({
      command: "start",
      botId: MasterBotId,
      description: "Start a chat"
    },);
    return cmdList;
  }

  async chatGptCommands() {
    const isEnableMultipleQuestion = await new ServerChatConfig(this.getSession(),this.getChatId()).isEnableMultipleQuestion();
    const cmdList = [];
    const botId = this.getChatId()
    cmdList.push({
      command: "start",
      botId: this.getChatId(),
      description: "Start a chat"
    });
    if (isEnableMultipleQuestion) {
      cmdList.push({
        command: "disableMultipleQuestions",
        description: "Disable multiple lines of questioning.",
        botId: botId,
      });
      cmdList.push({
        command: "send",
        botId: botId,
        description: "Send the above question to AI"
      },);
    } else {
      cmdList.push({
        command: "multipleQuestions",
        description: "Enable Multiple lines of questioning.",
        botId: botId,
      },);
    }
    return cmdList;
  }

  async start() {
    const buttons = [];
    const botAccount = await new ServerBotAccount(this.getSession(),this.getChatId()).get();
    if (botAccount && botAccount.type === "chatGpt") {

    }
    if (this.getChatId() === MasterBotId) {
      buttons.push([
        MsgHelper.buildCallBackAction("CreateChatGptBot", ServerCallbackButtonAction.Server_CreateChatGptBot),
      ])
    }
    buttons.push([
      MsgHelper.buildCallBackAction("ClearHistory", CallbackButtonAction.Local_clearHistory),
    ]);
    return this.replyText(`start`, buttons);
  }

  async processBotCommand(command: string) {
    switch (command) {
      case "start":
        return await this.start();
    }
  }

  async LoadBotCommands() {
    const cmdList = []
    if(this.getChatId() === MasterBotId){
      return this.masterCommands()
    }else{
      const botAccount = await new ServerBotAccount(this.getSession(),this.getChatId()).get();
      console.log("[botAccount]",botAccount,this.getChatId())
      if (botAccount) {
        const type = botAccount.type;
        switch (type) {
          case "chatGpt":
            return this.chatGptCommands()
        }
      }
    }
    cmdList.push({
      command: "start",
      botId: MasterBotId,
      description: "Start a chat"
    });
    return cmdList
  }

  async enableMultipleQuestion() {
    const msgId = await this.genMsgId()
    const enabled = await new ServerChatConfig(this.getSession(),this.getChatId()).isEnableMultipleQuestion()
    await new ServerChatConfig(this.getSession(),this.getChatId()).setConfig('enableMultipleQuestion',enabled ? "false" : "true")
    const commands = await new ServerChatMsgCommand(this.getSession(),this.getChatId()).LoadBotCommands()
    if(enabled){
      return {
        commands,
        msgId,
        text:`Multiple lines of questioning is Disables`
      }
    }else{
      return {
        commands,
        msgId,
        text:`Multiple lines of questioning is Enabled.Type /send to finish question.`
      }
    }
  }
}
