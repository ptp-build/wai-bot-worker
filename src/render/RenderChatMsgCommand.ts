import RenderChatMsg from "./RenderChatMsg";
import MsgHelper from "../masterChat/MsgHelper";
import {BotStatusType, CallbackButtonAction, WorkerCallbackButtonAction} from "../types";
import {UserIdFirstBot} from "../masterChat/setting";
import ChatConfig from "../window/ChatConfig";
import ChatAiMsg from "../window/ChatAiMsg";
import RenderBotWorkerStatus from "./RenderBotWorkerStatus";

export default class RenderChatMsgCommand extends RenderChatMsg{
  private isMasterChat: boolean;
  constructor(chatId:string,localMsgId?:number) {
    super(chatId,localMsgId);
    this.isMasterChat = this.getChatId() === UserIdFirstBot
  }

  defaultCommands(){
    const cmdList = [
      ["start","Start conversation."],
    ]
    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }
  masterCommands(){
    const cmdList = [
      ["start","Start conversation."],
      ["createWorker","Create Worker"],
      ["control","Control Panel"],
      ["setting","Setting panel"],
      ["clearHistory","Clear chat History."]
    ]
    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],UserIdFirstBot))
  }

  async chatGptCommands(){
    const enableMultipleQuestion = await ChatConfig.isEnableMultipleQuestion(this.getChatId())
    let cmdList
    if(enableMultipleQuestion){
      cmdList = [
        ["start","Start conversation."],
        ["control","Control Panel"],
        ["setting","Setting panel"],
        ["disableMultipleQuestions","Disable multiple lines of questioning."],
        ["sendQuestions","Send the above questions to AI"],
        ["clearHistory","Clear chat History."],
      ]
    }else{
      cmdList = [
        ["start","Start conversation."],
        ["setting","Setting panel"],
        ["control","Control Panel"],
        ["multipleQuestions","Enable Multiple lines of questioning"],
        ["clearHistory","Clear chat History."],
      ]
    }

    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }

  taskWorkerCommands(){
    const cmdList = [
      ["start","Start conversation."],
      ["control","Control Panel"],
      ["setting","Setting panel"],
      ["clearHistory","Clear chat History."]
    ]
    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }
  customWorkerCommands(){
    const cmdList = [
      ["start","Start conversation."],
      ["control","Control Panel"],
      ["setting","Setting panel"],
      ["clearHistory","Clear chat History."]
    ]
    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }
  async loadBotCommands(){
    if(this.isMasterChat){
      return this.masterCommands()
    }
    const workerAccount = await this.getWorkerAccount()
    if(workerAccount){
      const {type} = workerAccount
      switch (type){
        case "chatGpt":
          return await this.chatGptCommands()
        case "taskWorker":
          return this.taskWorkerCommands()
        case "custom":
          return this.customWorkerCommands()
      }
    }
    return this.defaultCommands()
  }

  async control(msgId?:number){
    const {statusBot} = RenderBotWorkerStatus.get(this.getChatId())
    const buttons = []
    if(this.isMasterChat){
      buttons.push(
        [MsgHelper.buildCallBackAction("✖️ Open User Data Dir",CallbackButtonAction.Master_openUserAppDataDir)]
      )
    }else{
      buttons.push(
        ...RenderBotWorkerStatus.getBeforeBotReadyReadyButtons(
          this.getChatId(),
          RenderBotWorkerStatus.getStatusBotCenter()
        )
      )

      if(statusBot !== BotStatusType.OFFLINE){
        buttons.push(...[
          [MsgHelper.buildCallBackAction("🚀 Active Worker Window",CallbackButtonAction.Master_OpenWorkerWindow)],
          [MsgHelper.buildCallBackAction("✖️ Close Worker Window",CallbackButtonAction.Master_closeWorkerWindow)]
        ])
        buttons.push(
          [
            MsgHelper.buildCallBackAction("🔁 Reload Win",WorkerCallbackButtonAction.Worker_locationReload),
          ],
        )
        buttons.push(
          [
            MsgHelper.buildCallBackAction("📐 Test",WorkerCallbackButtonAction.Worker_getCommands)
          ],
        )
      }else{
        buttons.push(...[
          [MsgHelper.buildCallBackAction("🛠️ Open Worker Window",CallbackButtonAction.Master_OpenWorkerWindow)],
        ])
      }

      buttons.push(
        [
          MsgHelper.buildCallBackAction("↩️️ Cancel",CallbackButtonAction.Local_cancelMessage),
          MsgHelper.buildCallBackAction("🔀 Refresh Control Panel",CallbackButtonAction.Render_refreshControlPanel),
        ]
      )
    }

    const text = "Control Panel:"
    if(!msgId){
      return this.replyText(text,buttons)
    }else{
      await this.handleUpdateMessage({
        msgId,text,entities:[],chatId:this.getChatId(),inlineButtons:buttons
      })
    }
  }
  async createWorker(){
    return this.replyText("Choose worker type below:",[
      [MsgHelper.buildCallBackAction("ChatGpt Worker",CallbackButtonAction.Master_createChatGptBotWorker)],
      [MsgHelper.buildCallBackAction("Task Worker",CallbackButtonAction.Master_createTaskWorker)],
      [MsgHelper.buildCallBackAction("Custom Worker",CallbackButtonAction.Master_createCustomWorker)],
      [MsgHelper.buildCallBackAction("↩️️ Cancel",CallbackButtonAction.Local_cancelMessage)],
    ])
  }
  async setting(){
    let helper = "Setting panel:"
    const workerAccount = await this.getWorkerAccount()
    const buttons = []

    if(this.isMasterChat){
      buttons.push([
        MsgHelper.buildCallBackAction("🛠️️ Setup ChatGpt Auth",CallbackButtonAction.Local_setupChatGptAuth),
      ])
      buttons.push([
        MsgHelper.buildCallBackAction("🛠️️️ Setup Task Url",CallbackButtonAction.Local_setupTaskUri),
      ])

      buttons.push([
        MsgHelper.buildCallBackAction("🛠️️️ Setup MySql Message storage",CallbackButtonAction.Local_mysqlMsgStorage),
      ])
    }else{
      buttons.push([
        MsgHelper.buildCallBackAction("🛠️️ Setup Worker Name",CallbackButtonAction.Local_setupWorkerName),
      ])
    }
    if(workerAccount){
      switch (workerAccount.type){
        case "chatGpt":
          buttons.push([
            MsgHelper.buildCallBackAction("🛠️️ Setup ChatGpt Auth",CallbackButtonAction.Local_setupChatGptAuth),
          ])
          break
        case "taskWorker":
          buttons.push([
            MsgHelper.buildCallBackAction("🛠️️️ Setup Task Url",CallbackButtonAction.Local_setupTaskUri),
          ])
          break
        case "custom":
          buttons.push([
            MsgHelper.buildCallBackAction("🛠️️️ Setup Home Url",CallbackButtonAction.Local_setupHomeUrl),
          ])
          break
        default:
          break
      }
    }

    buttons.push([
      MsgHelper.buildCallBackAction("↩️️ Cancel",CallbackButtonAction.Local_cancelMessage),
    ])
    return this.replyText(helper,buttons)
  }
  async start(){
    const commands = await this.loadBotCommands();

    let helper = "\n🧭 The following commands can be used to control me.\n\n"
    commands.forEach(row=>{
      helper += ` - ⏺️ /${row.command}  ${row.description}\n`
    })
    return this.replyText(helper,[])
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
        commands:await this.chatGptCommands()
      }
    }else{
      return {
        msgId,
        text:`Multiple lines of questioning is Enabled.Type /send to finish question.`,
        commands:await this.chatGptCommands()
      }
    }
  }
  async processBotCommand(command:string){
    switch (command){
      case "start":
        return await this.start()
      case "setting":
        return await this.setting()
      case "control":
        return await this.control()
      case "createWorker":
        return await this.createWorker()
    }
    return this.replyAck()
  }
}
