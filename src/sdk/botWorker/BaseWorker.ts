import {
  BotStatusType,
  BotWorkerStatusType,
  LocalWorkerAccountType,
  WorkerCallbackButtonAction,
  WorkerEventActions,
  WorkerEvents,
} from '../types';
import MsgHelper from '../helper/MsgHelper';
import BaseWorkerMsg, { SiteInfo } from './BaseWorkerMsg';
import FileHelper from '../helper/FileHelper';
import { currentTs } from '../common/time';

export default class BaseWorker extends BaseWorkerMsg{
  public statusBot_pre?:BotStatusType;
  public statusBotWorker_pre?:BotWorkerStatusType;

  public statusBot:BotStatusType;
  public statusBotWorker:BotWorkerStatusType;
  public botId: string;
  private workerAccount: LocalWorkerAccountType;

  constructor(workerAccount: LocalWorkerAccountType) {
    super(workerAccount.botId)
    this.statusBot = BotStatusType.STARTED;
    this.statusBotWorker = BotWorkerStatusType.WaitToReady
    this.workerAccount = workerAccount
    this.botId = workerAccount.botId;
    if(this.workerAccount.type !== "bot"){
      this.handleSiteInfo()
    }
  }

  async replyJsonFile(name:string,json:any){
    const fileData = JSON.stringify(json,null,2)
    await this.replyMessageTextDoc(
      this.botId,name,fileData,fileData.length,"application/json",
      "plainData\r\n",
      [
        MsgHelper.buildOpenDocBtn()
      ]
    )
  }
  async replyMessageTextDoc(chatId:string,fileName:string,fileData:string,size:number,mimeType:string,type:"plainData\r\n"|"base64" = "base64",inlineButtons?:any[][]){
    if(type === 'base64'){
      await this.replyMessageDoc(chatId,fileName,"data:"+mimeType+";"+type+","+btoa(unescape(encodeURIComponent(fileData))),size,mimeType,inlineButtons)
    }else{
      await this.replyMessageDoc(chatId,fileName,"data:"+mimeType+";"+type+fileData,size,mimeType,inlineButtons)
    }
  }
  async replyMessageDoc(chatId:string,fileName:string,fileData:string,size:number,mimeType:string,inlineButtons?:any[][]){
    const id = await new FileHelper(chatId).save(fileData)
    return this.replyMessageWithCancel({
      document:{
        id,
        fileName,
        size:fileData.length,
        mimeType,
        timestamp:currentTs()
      }
    },inlineButtons)
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

  reportStatus(statusBot?: BotStatusType,statusBotWorker?:BotWorkerStatusType) {
    if(!statusBot){
      statusBot = this.statusBot
    }
    if(!statusBotWorker){
      statusBotWorker = this.statusBotWorker
    }

    if(statusBot !== this.statusBot_pre || statusBotWorker !== this.statusBotWorker_pre){
      this.statusBot_pre = statusBot
      this.statusBotWorker_pre = statusBotWorker
      this.getBridgeMasterWindow().updateWorkerStatus({
        statusBot,
        statusBotWorker,
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
        this.reportStatus(this.statusBot!,this.statusBotWorker!)
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

  actions(){
    if(this.workerAccount.type !== 'bot'){
      return [
        [
          MsgHelper.buildCallBackAction("SiteInfo",WorkerCallbackButtonAction.Worker_fetchSiteInfo)
        ]
      ]
    }else{
      return [
        [
          MsgHelper.buildCallBackAction("Debug",WorkerCallbackButtonAction.Worker_debug)
        ]
      ]
    }
  }
  async handleCallBackButton({ path }:{path:string}) {
    switch (path) {
      case WorkerCallbackButtonAction.Worker_getActions:
        await this.replyTextWithCancel("Actions", this.actions());
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
}
