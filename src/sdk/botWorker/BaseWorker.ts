import {
  BotStatusType,
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
          payload.pluginJs !== this.workerAccount.pluginJs
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
        console.debug("[mousedown]",e.button,e.x,e.y)
      })
    }
    return this;
  }
  buildCallBackAction(text:string,action:WorkerCallbackButtonAction | string,payload?:any){
    return MsgHelper.buildCallBackAction(text,action,{...payload,botId:this.botId})
  }
  actions(chatId?:string){
    let buttons = []
    if(this.workerAccount.type !== 'bot' && (chatId && !chatId.startsWith("-"))){
      buttons = [
        [
          this.buildCallBackAction("SiteInfo",WorkerCallbackButtonAction.Worker_fetchSiteInfo)
        ]
      ]
    }else{
      buttons =  [
        [
          this.buildCallBackAction("Debug",WorkerCallbackButtonAction.Worker_debug)
        ]
      ]
    }
    buttons.push(
      [
        this.buildCallBackAction("Status",WorkerCallbackButtonAction.Worker_status)
      ]
    )
    return buttons
  }
  async handleCallBackButton(payload:{path:string,chatId:string}) {
    const {path,chatId} = payload
    switch (path) {
      case WorkerCallbackButtonAction.Worker_getActions:
        await this.replyTextWithCancel("Actions", this.actions(chatId),chatId);
        break;
      case WorkerCallbackButtonAction.Worker_status:
        this.reportStatus()
        await this.replyTextWithCancel(`Status: [${this.statusBot}]`, [],chatId);
        break;
      case WorkerCallbackButtonAction.Worker_debug:
        await this.replyTextWithCancel("Debug");
        break;
      case WorkerCallbackButtonAction.Worker_browserUserAgent:
        await this.replyTextWithCancel(window.navigator.userAgent)
        break;
      case WorkerCallbackButtonAction.Worker_openDevTools:
        await this.getBridgeWorkerWindow().showDevTools()
        break;
      case WorkerCallbackButtonAction.Worker_locationReload:
        await this.getBridgeWorkerWindow().reload()
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
      await this.updateMsg({
        ...msg,
        chatId:chatId || this.botId,
        msgId,
        text:"recv:"+text
      })
    },2000)
  }

}
