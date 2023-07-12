import {
  BotStatusType,
  CallbackButtonAction,
  LocalWorkerAccountType,
  WorkerCallbackButtonAction,
  WorkerEventActions,
  WorkerEvents,
} from '../types';
import MsgHelper from '../helper/MsgHelper';
import BaseWorkerMsg, { SiteInfo } from './BaseWorkerMsg';

export default class BaseWorker extends BaseWorkerMsg{
  public statusBot_pre?:BotStatusType;
  public statusBot:BotStatusType;
  public botId: string;
  private workerAccount: LocalWorkerAccountType;

  constructor(workerAccount: LocalWorkerAccountType) {
    super(workerAccount.botId)
    this.statusBot = BotStatusType.OFFLINE
    this.workerAccount = workerAccount
    this.botId = workerAccount.botId;
    if(this.workerAccount.type !== "bot"){
      this.handleSiteInfo()
    }
  }

  async handleSiteLogo(siteInfo:SiteInfo){
    if(this.workerAccount.avatarHash){
      return
    }
    if(!this.isLogoUpdated()){
      let hasLogo = false
      if(siteInfo.logo) {
        try {
          if (siteInfo.logo.url) {
            await this.updateSiteLogo(this.botId, siteInfo.logo.url)
            hasLogo = true
          }
          if (siteInfo.logo.dataUri) {
            await this.updateSiteLogo(this.botId, siteInfo.logo.dataUri)
            hasLogo = true
          }
        } catch (e) {
          console.error(e)
        }
      }
      if(!hasLogo){
        console.warn("no site logo found!",siteInfo)
      }
    }
  }

  handleSiteInfo() {
    const siteInfo = this.getSiteInfo();
    this.handleSiteLogo(siteInfo).catch(console.error)
    return siteInfo
  }
  getHomeUrl(){
    if(this.getWorkerAccount().type === "chatGpt"){
      return "https://chat.openai.com"
    }
    return this.getWorkerAccount().customWorkerUrl!
  }
  getWorkerAccount(){
    return this.workerAccount
  }

  reportStatus(statusBot?: BotStatusType) {
    if(!statusBot){
      statusBot = this.statusBot
    }
    if(statusBot !== this.statusBot_pre){
      this.statusBot_pre = statusBot
      this.statusBot = statusBot
      this.getBridgeMasterWindow().updateWorkerStatus({
        statusBot,
        botId: this.botId,
      }).catch(console.error);
    }
  }

  getWorkersStatus() {
    void this.getBridgeMasterWindow().getWorkersStatus()
  }
  restartWorkerWindow() {
    return this.getBridgeMasterWindow().restartWorkerWindow({
      botId: this.botId,
    })
  }
  handleEvent(action:WorkerEventActions, payload:any) {
    switch (action) {
      case WorkerEventActions.Worker_UpdateWorkerAccount:
        if(
          payload.browserUserAgent !== this.workerAccount.browserUserAgent ||
          payload.proxy !== this.workerAccount.proxy ||
          payload.customWorkerUrl !== this.workerAccount.customWorkerUrl ||
          payload.pluginJs !== this.workerAccount.pluginJs ||
          payload.appHeight !== this.workerAccount.appHeight ||
          payload.appWidth !== this.workerAccount.appWidth
        ){
          void this.replyTextWithCancel("restarting...")
          void this.restartWorkerWindow()
        }
        this.workerAccount = payload
        break;
      case WorkerEventActions.Worker_GetWorkerStatus:
        this.statusBot_pre = undefined
        this.reportStatus()
        break;
      case WorkerEventActions.Worker_CallBackButton:
        this.handleCallBackButton(payload).catch(console.error);
        break;
    }
  }
  addEvents() {
    console.log("addEvents",this.botId)
    window.electron?.on(WorkerEvents.Worker_Chat_Msg, async (botId:string, action:WorkerEventActions, payload:any) => {
      if(botId === this.botId){
        await this.handleEvent(action, payload);
      }
    });
    if(this.workerAccount.type !== 'bot'){
      window.addEventListener("keypress",(e)=>{
        console.debug("[keypress]",e.key,e.code)
      })
      window.addEventListener("mousedown",(e)=>{
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        console.debug({scrollLeft,scrollTop,})
        const {x,y} = e
        console.debug("[mousedown]",`click(${x},${y})`,e.target)
        // @ts-ignore
        if(window.MOCK_CLICK){ e.target.click()}
      })
    }
    return this;
  }
  buildCallBackAction(text:string,action:WorkerCallbackButtonAction | string,payload?:any){
    return MsgHelper.buildCallBackAction(text,action,{...payload,botId:this.botId})
  }

  actions(chatId?:string){
    let buttons: { text: string; data?: string; type: string; }[][] = []
    if(this.workerAccount.type !== 'bot' && (chatId && !chatId.startsWith("-"))){
      buttons = [
        [
          this.buildCallBackAction("🌐 网站信息",WorkerCallbackButtonAction.Worker_fetchSiteInfo),
          this.buildCallBackAction("🔗 当前网址",WorkerCallbackButtonAction.Worker_currentLocation),
          this.buildCallBackAction("🌍 浏览器标识",WorkerCallbackButtonAction.Worker_browserUserAgent)
        ]
      ]
      buttons.push([
        this.buildCallBackAction("🏠 主页",WorkerCallbackButtonAction.Worker_openHomeUrl),
        this.buildCallBackAction("🛠️ 开发工具",WorkerCallbackButtonAction.Worker_openDevTools),
      ])

      buttons.push([
        this.buildCallBackAction("⬅️ 后退",WorkerCallbackButtonAction.Worker_historyGoBack),
        this.buildCallBackAction("🔄 刷新窗口",WorkerCallbackButtonAction.Worker_locationReload),
        this.buildCallBackAction("↩️ 重启窗口",WorkerCallbackButtonAction.Worker_restartWindow)
      ])

      buttons.push([
        this.buildCallBackAction("🚀 打开窗口",CallbackButtonAction.Master_OpenWorkerWindow),
        this.buildCallBackAction("❌️ 关闭窗口",WorkerCallbackButtonAction.Worker_closeWindow),
      ])
    }
    buttons.push(
      [
        this.buildCallBackAction("🔋 当前状态",WorkerCallbackButtonAction.Worker_status),
      ]
    )
    buttons.push([MsgHelper.buildUnsupportedAction()])
    return buttons
  }
  async reply(chatId:string,text:string,ignoreSaveToDb?:boolean,withCancelButton?:boolean,inlineButtons?:any[]){
    return await this.replyMsg({
      text,
      chatId,
      inlineButtons,
      msgId:await this.applyMsgId(chatId),
    },{
      ignoreSaveToDb,
      withCancelButton
    });
  }
  getActionTips(tips?:string){
    return tips || ""
  }
  async actionsCallback(chatId:string){
    let text = "\n⏺️ 动作指令\n";
    text += this.getActionTips();
    await this.replyMsg({
      text,
      chatId,
      msgId:await this.applyMsgId(chatId),
      inlineButtons:this.actions(chatId)
    },{
      ignoreSaveToDb:true,
      withCancelButton:true
    });
  }

  async help(chatId:string){
    let text = "\n🎓使用帮助\n";
    return this.reply(chatId,text,true)
  }
  async handleCallBackButton(payload:{path:string,chatId:string}) {
    const {path,chatId} = payload
    switch (path) {
      case WorkerCallbackButtonAction.Worker_help:
        await this.help(chatId)
        break
      case WorkerCallbackButtonAction.Worker_getActions:
        await this.actionsCallback(chatId)
        break;
      case WorkerCallbackButtonAction.Worker_status:
        this.reportStatus()
        await this.reply(chatId,`🔋 当前状态: [${this.statusBot}]`,true,true)
        break;
      case WorkerCallbackButtonAction.Worker_debug:
        await this.reply(chatId,`Debug`,true,true)
        break;
      case WorkerCallbackButtonAction.Worker_openHomeUrl:
        await this.getBridgeWorkerWindow().loadUrl({url:this.getHomeUrl()})
        break;
      case WorkerCallbackButtonAction.Worker_currentLocation:
        await this.reply(chatId,`🔗 当前网址: ${window.location.href}`,true,true)
        break
      case WorkerCallbackButtonAction.Worker_browserUserAgent:
        await this.reply(chatId,`🌍 浏览器标识: ${window.navigator.userAgent}`,true,true,[
          [MsgHelper.buildCallBackAction("🛠️️ 修改",CallbackButtonAction.Local_setupBrowserUserAgent)]
        ])
        break;
      case WorkerCallbackButtonAction.Worker_openDevTools:
        await this.getBridgeWorkerWindow().showDevTools()
        break;
      case WorkerCallbackButtonAction.Worker_locationReload:
        await this.getBridgeWorkerWindow().reload()
        break;
      case WorkerCallbackButtonAction.Worker_restartWindow:
        await this.getBridgeMasterWindow().restartWorkerWindow({botId:this.botId})
        break;
      case WorkerCallbackButtonAction.Worker_closeWindow:
        await this.getBridgeMasterWindow().closeWorkerWindow({botId:this.botId})
        break;
      case WorkerCallbackButtonAction.Worker_historyGoBack:
        await this.getBridgeWorkerWindow().goBack()
        break;
      case WorkerCallbackButtonAction.Worker_fetchSiteInfo:
        const siteInfo = this.handleSiteInfo()
        await this.replyJsonFile("SiteInfo.json",siteInfo)
    }
  }

  async onMessage({text,chatId}:{text:string,chatId:string}){
    const msgId = await this.applyMsgId(this.botId)
    const msg = await this.replyMsg({
      chatId:chatId || this.botId,
      msgId,
      text:"..."
    })

    setTimeout(async ()=>{
      console.log()

      await this.updateMsg({
        ...msg,
        chatId:chatId || this.botId,
        msgId,
        text:"recv:"+JSON.stringify(this.getWorkerAccount(),null,2)
      })
    },2000)
  }

}
