import { CallbackButtonAction, WorkerCallbackButtonAction } from '../../sdk/types';
import MsgHelper from '../../sdk/helper/MsgHelper';
import RenderChatMsg from '../RenderChatMsg';
import RenderCallbackButton from '../RenderCallbackButton';
import BridgeWorkerWindow from '../../sdk/bridge/BridgeWorkerWindow';

export default class BaseCommand extends RenderChatMsg{
  constructor(chatId:string,localMsgId?:number,botId?:string) {
    super(chatId,localMsgId,botId)
  }
  async loadBotCommands(){
    const cmdList = [
      ["start","Start conversation."],
      ["setting","Setting panel"],
      ["action","Action panel"],
      ["reloadWindow","Reload Window"],
      ["activeWindow","Active Window"],
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
      MsgHelper.buildCallBackAction("🛠️️ UserName",CallbackButtonAction.Local_setupWorkerUserName),
    ])

    buttons.push([
      MsgHelper.buildCallBackAction("🛠️️ Browser UserAgent",CallbackButtonAction.Local_setupBrowserUserAgent),
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

  async action(action?:"reloadWindow" | "activeWindow" | "openWindow"){
    const ack = await this.replyAck()
    switch (action){
      case 'openWindow':
        await RenderCallbackButton.invokeMasterWindowCallbackButton(CallbackButtonAction.Master_OpenWorkerWindow,{botId:this.getBotId(),chatId:this.getChatId()})
        break
      case 'activeWindow':
        await new BridgeWorkerWindow().activeWindow(this.getChatId())
        break
      case 'reloadWindow':
        await RenderCallbackButton.invokeWorkerWindowCallbackButton(WorkerCallbackButtonAction.Worker_locationReload,{botId:this.getBotId(),chatId:this.getChatId()})
        break
      default:
        await RenderCallbackButton.invokeWorkerWindowCallbackButton(WorkerCallbackButtonAction.Worker_getActions,{botId:this.getBotId(),chatId:this.getChatId()})
        break
    }
    return ack
  }

  async control(msgId?:number){
    const buttons = []
    if(this.getIsMasterBot()){
      buttons.push(
        [MsgHelper.buildCallBackAction("✖️ User Data Dir",CallbackButtonAction.Master_openUserAppDataDir)]
      )
      buttons.push(
        [MsgHelper.buildCallBackAction("✖️ Worker Status",CallbackButtonAction.Render_workerStatus)]
      )
    }else{
      if((await this.getWorkerAccount()).type !== 'bot'){
        buttons.push(...[
          [MsgHelper.buildCallBackAction("🚀 Open Window",CallbackButtonAction.Master_OpenWorkerWindow)],
          [MsgHelper.buildConfirmCallBackAction(
            "✖️ Close Window",
            CallbackButtonAction.Master_closeWorkerWindow,"✖️ Close Window ?",
            {
              checkOnline:true,
            }
          )]
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
            MsgHelper.buildUnsupportedAction(),
          ]
        )

      }

      buttons.push(
        [
          MsgHelper.buildConfirmCallBackAction("Create Group",CallbackButtonAction.Local_createGroup,"Create Group?"),
        ]
      )

      buttons.push(
        [
          MsgHelper.buildCallBackAction("Copy Bot Worker",CallbackButtonAction.Local_copyBot),
        ]
      )

      buttons.push(
        [MsgHelper.buildConfirmCallBackAction(
          "✖️ Delete Bot",
          CallbackButtonAction.Local_deleteBot,"✖️ Delete Bot ?",
        )]
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
    const ack = await this.replyAck()
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
      case "activeWindow":
        return await this.action("activeWindow")
      case "openWindow":
        return await this.action("openWindow")
    }
    return ack
  }
}
