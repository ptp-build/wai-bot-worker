import { CallbackButtonAction, LocalWorkerAccountType, WorkerCallbackButtonAction } from '../../sdk/types';
import MsgHelper from '../../sdk/helper/MsgHelper';
import RenderChatMsg from '../RenderChatMsg';
import RenderCallbackButton from '../RenderCallbackButton';
import BridgeWorkerWindow from '../../sdk/bridge/BridgeWorkerWindow';
import KvCache from '../../worker/services/kv/KvCache';
import WorkerAccount from '../../window/woker/WorkerAccount';

export default class BaseCommand extends RenderChatMsg{
  constructor(chatId:string,localMsgId?:number,botId?:string) {
    super(chatId,localMsgId,botId)
  }

  getShortKeyCmds(){
    return {
      "-o":"打开窗口",
      "-b":"窗口后退",
      "-c":"关闭窗口",
      "-r":"刷新窗口",
      "-rr":"重启窗口",
      "-a":"激活窗口",
      "-h":"打开主页",
      "-d":"打开DevTools",
      "-l":"打开网址：-l http://www.google.com",
    }
  }

  getShortKeyCmd(){
    let text = "\n\n快捷指令\n";
    const cmds = this.getShortKeyCmds()
    Object.keys(cmds).forEach(cmd=>{
      //@ts-ignore
      text += `▶️ ${cmd}: ${cmds[cmd]}\n`
    })
    return text
  }

  async cancelSetupChatGptRole(){
    await KvCache.getInstance().delete(`setupChatGptRole_${this.getChatId()}`)
  }

  async isSetupChatGptRole(){
    return await KvCache.getInstance().get(`setupChatGptRole_${this.getChatId()}`)
  }

  async setupChatGptRoleConfirm(text:string){
    const account = await this.getWorkerAccount()
    const newAccount = {
      ...account as LocalWorkerAccountType,
      chatGptRole:text
    }
    await new WorkerAccount(this.getChatId()).update(newAccount)
    await new BridgeWorkerWindow(this.getChatId()).updateWorkerAccount(newAccount)
    await this.brain();
  }

  async setupChatGptRole(){
    await KvCache.getInstance().put(`setupChatGptRole_${this.getChatId()}`,true)
    const text = "请输入角色描述👇👇👇,并发送给我:"
    await this.replyNewMessage(text)
  }
  async brain(){
    const {chatGptRole} = await this.getWorkerAccount()

    const ack = await this.replyAck()
    let helper = " ⏺️ 大脑:\n\n"
    if(chatGptRole){
      helper += "  当前角色: ```\n"+chatGptRole+"```\n\n"
    }

    helper += " - 🧙‍ 设置角色: 设置一个角色，更精准完成对话\n"
    if(!chatGptRole){
      helper += "  如: ```\n你现在来充当一名英文翻译```\n\n"
    }
    helper += " - 📥️‍ 格式化输入: 设置一种提问格式\n"
    helper += "  示例: ```\n翻译:\"${prompts}\", 回复JSON:{reply:''}```\n"
    helper += "  其中 ${prompts} 是您输入的prompts，如果输入: 大海 \n"
    helper += "  那么: ChatGpt得到请求将是：```\n翻译:\"大海\", 回复JSON:{reply:''}```\n"

    helper += " - 📤 解析输出: 设置一段代码解析输出结果\n"
    helper += "  如上设置格式化输入，ChatGpt大概率会输出：```\nbalabala...,(一堆解释...),{reply:''}```\n"
    helper += "  如果您需要的只是reply部分，那么解析代码可以这样编写：```\n" +
      `
JSON.parse(result.substring(result.indexOf("{"),result.lastIndexOf("}")+1)).reply
      ` +
      "```\n" +
      "result 是默认参数\n"
    let buttons:any[] = []
    buttons.push([
      MsgHelper.buildCallBackAction("🧙‍ 设置角色",CallbackButtonAction.Render_setupChatGptRole),
    ])

    buttons.push([
      MsgHelper.buildCallBackAction("📥️ 格式化输入",CallbackButtonAction.Local_setupPromptFormat),
      MsgHelper.buildCallBackAction("📤 解析输出",CallbackButtonAction.Local_setupReplyParser),
    ])
    buttons.push(MsgHelper.buildLocalCancel())
    await this.replyNewMessage(helper,buttons)
    return ack
  }
  async loadBotCommands(){
    const cmdList = [
      ["start","开始对话"],
      ["control","控制指令"],
      ["action","动作指令"],
      ["setting","设置选项"],
      // ["help","使用帮助"],
    ]
    return cmdList.map(cmd=>MsgHelper.buildCommand(cmd[0],cmd[1],this.getChatId()))
  }
  async getSettingHelp(showProxy?:boolean){
    let helper = ""
    if(!this.isMasterBot){
      const account = await this.getWorkerAccount();
      helper += " - 👤 名称: 设置一个容易记住名称\n"
      helper += ` - 🆔️ 用户名: 设置一个用户名,通过 @${account.username} 您可以在群组中发送消息给我`
      if(showProxy){
        helper += ` - 🕵️ 匿名代理: 设置匿名网络代理`
      }
    }
    return helper
  }
  async start(bio?:string,tips?:string){
    const commands = await this.loadBotCommands();
    let helper = "\n"
    if(bio){
      const {username} = await this.getWorkerAccount()
      bio = bio.replace(/\\n/g,"\n")
      bio = bio.replace(/\{username\}/g,username)
      helper += `${bio}\n\n`
    }
    helper += "🧭 您可以通过发送以下指令,来控制我\n\n"
    commands.forEach(row=>{
      helper += ` - ⏺️ /${row.command}  ${row.description}\n`
    })
    if(tips){
      helper += `${tips}\n`
    }
    return this.replyText(helper,[])
  }

  getSettingButtons(){
    const buttons = []
    buttons.push([
      MsgHelper.buildCallBackAction("🆔️️ 用户名",CallbackButtonAction.Local_setupWorkerUserName),
    ])

    buttons.push([
      MsgHelper.buildCallBackAction("👤 名称",CallbackButtonAction.Local_setupWorkerName),
      MsgHelper.buildCallBackAction("📝️ 简介",CallbackButtonAction.Local_setupWorkerBio),
    ])

    buttons.push([
      MsgHelper.buildCallBackAction("🕵️ 匿名代理",CallbackButtonAction.Local_setupProxy),
    ])

    buttons.push([
      MsgHelper.buildCallBackAction("🖼️️ 窗口宽高",CallbackButtonAction.Local_setupWidthHeight),
    ])
    return buttons
  }

  async setting(){
    let helper = "设置选项:"
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

    let text = "\n ⏺️ 控制指令:"
    if(this.getIsMasterBot()){
      buttons.push(
        [
          MsgHelper.buildCallBackAction("🗂️ 用户数据目录",CallbackButtonAction.Master_openUserAppDataDir),
          MsgHelper.buildCallBackAction("🟢 Worker状态",CallbackButtonAction.Render_workerStatus)
        ]
      )
    }else{

      text += `\n`
      text += `\n- 👥 创建群组: 您可以创建一个群组，我将是管理员，您可以在群组中@我，或者邀请其他的Worker进来，共同完成一个任务`
      text += `\n`
      text += `\n- 📋 复制我: 您可以通过设置复制数量,复制多个类似我的机器人出来`

      buttons.push(
        [
          MsgHelper.buildConfirmCallBackAction("👥 创建群组",CallbackButtonAction.Local_createGroup,"创建群组 ?"),
        ]
      )

      buttons.push(
        [
          MsgHelper.buildCallBackAction("📋 复制我",CallbackButtonAction.Local_copyBot),
        ]
      )

      buttons.push(
        [MsgHelper.buildConfirmCallBackAction(
          "✖️ 删除我",
          CallbackButtonAction.Local_deleteBot,"🗑️️ 删除我 ?",
        )]
      )
    }
    buttons.push(
      [MsgHelper.buildConfirmCallBackAction(
        "🧹 清空聊天记录",
        CallbackButtonAction.Local_clearHistory,"清空聊天记录 ?",
      )]
    )
    buttons.push(MsgHelper.buildLocalCancel())

    if(!msgId){
      return this.replyText(text,buttons)
    }else{
      await this.handleUpdateMessage({
        msgId,text,entities:[],chatId:this.getChatId(),inlineButtons:buttons
      })
    }
  }
  async help(){
    const ack = this.replyAck()
    await RenderCallbackButton.invokeWorkerWindowCallbackButton(WorkerCallbackButtonAction.Worker_help,{botId:this.getBotId(),chatId:this.getChatId()})
    return ack
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
      case "help":
        return await this.help()
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
