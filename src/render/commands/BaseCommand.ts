import RenderChatMsg from '../RenderChatMsg';
import { CallbackButtonAction, WorkerCallbackButtonAction } from '../../types';
import MsgHelper from '../../masterChat/MsgHelper';
import { encodeCallBackButtonPayload } from '../../utils/utils';
import { UserIdFirstBot } from '../../masterChat/setting';

export default class BaseCommand extends RenderChatMsg{
  private isMasterChat: boolean;
  constructor(chatId:string,localMsgId?:number) {
    super(chatId,localMsgId)
    this.isMasterChat = this.getChatId() === UserIdFirstBot
  }
  async loadBotCommands(){
    const cmdList = [
      ["start","Start conversation."],
      ["setting","Setting panel"],
      ["action","Action panel"],
      ["reloadWindow","Reload Window"],
      ["openWindow","Open Window"],
      ["control","Control Panel"],
      ["clearHistory","Clear chat History."],
    ]
    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }
  async start(){
    const commands = await this.loadBotCommands();
    let helper = "\n🧭 The following commands can be used to control me.\n\n"
    commands.forEach(row=>{
      helper += ` - ⏺️ /${row.command}  ${row.description}\n`
    })
    return this.replyText(helper,[])
  }

  getSettingButtons(){
    const buttons = []
    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️ Worker Name",CallbackButtonAction.Local_setupWorkerName),
    ])

    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️ Browser UserAgent",CallbackButtonAction.Local_setupBrowserUserAgent),
    ])

    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️ Proxy",CallbackButtonAction.Local_setupProxy),
    ])
    return buttons
  }

  async setting(){
    let helper = "Setting panel:"
    const buttons = this.getSettingButtons()
    buttons.push([
      MsgHelper.buildCallBackAction("↩️️ Cancel",CallbackButtonAction.Local_cancelMessage),
    ])
    return this.replyText(helper,buttons)
  }

  async action(action?:"reloadWindow" | "openWindow"){
    const ack = this.replyAck()
    switch (action){
      case 'openWindow':
        await this.invokeMasterCallBackButton(CallbackButtonAction.Master_OpenWorkerWindow)
        break
      case 'reloadWindow':
        await this.invokeWorkerCallBackButton(WorkerCallbackButtonAction.Worker_locationReload)
        break
      default:
        await this.invokeWorkerCallBackButton(WorkerCallbackButtonAction.Worker_getActions)
        break
    }
    return ack
  }

  async control(msgId?:number){
    const buttons = []
    if(this.isMasterChat){
      buttons.push(
        [MsgHelper.buildCallBackAction("✖️ User Data Dir",CallbackButtonAction.Master_openUserAppDataDir)]
      )
      buttons.push(
        [MsgHelper.buildCallBackAction("✖️ Worker Status",CallbackButtonAction.Render_workerStatus)]
      )
    }else{
      buttons.push(...[
        [MsgHelper.buildCallBackAction("🚀 Open Window",CallbackButtonAction.Master_OpenWorkerWindow)],
        [MsgHelper.buildCallBackAction("✖️ Close Window",encodeCallBackButtonPayload(CallbackButtonAction.Master_closeWorkerWindow,{
          checkOnline:true,
          showConfirm:true,
          confirmText:"✖️ Close Window ?",
        }))]
      ])
      buttons.push(
        [
          MsgHelper.buildCallBackAction("🔁 Reload Window",WorkerCallbackButtonAction.Worker_locationReload),
          MsgHelper.buildCallBackAction("◀️ GoBack Window",WorkerCallbackButtonAction.Worker_historyGoBack),
        ],
      )
      buttons.push(
        [
          MsgHelper.buildCallBackAction("🔀 DevTool",WorkerCallbackButtonAction.Worker_openDevTools),
          MsgHelper.buildCallBackAction("🔀 Browser UserAgent",WorkerCallbackButtonAction.Worker_browserUserAgent),
        ]
      )

      buttons.push(
        [
          MsgHelper.buildCallBackAction("↩️️ Cancel",CallbackButtonAction.Local_cancelMessage),
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
  async processBotCommand(command:string){
    const ack = this.replyAck()
    switch (command) {
      case "start":
        return await this.start()
      case "setting":
        return await this.setting()
      case "action":
        return await this.action()
      case "control":
        return await this.control()
      case "reloadWindow":
        return await this.action("reloadWindow")
      case "openWindow":
        return await this.action("openWindow")
    }
    return ack
  }
}
