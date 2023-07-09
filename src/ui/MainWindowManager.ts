import { BrowserWindow, HandlerDetails, shell } from 'electron';
import path from 'path';
import Devtool from './Devtool';
import { isProd } from '../utils/electronEnv';
import WindowEventsHandler from '../window/events/WindowEventsHandler';
import { BotStatusType, LocalWorkerAccountType, MasterEventActions, WindowActions } from '../sdk/types';
import WorkerAccount from '../window/woker/WorkerAccount';
import { getProxyConfigFromProxyConfStr } from '../sdk/common/proxy';
import { getErrorHtmlPage } from './Ui';
import { getMasterWindowWebContent } from './window';
import MsgHelper from '../sdk/helper/MsgHelper';

const __managers = new Map<string, MainWindowManager>();

export type WinOptions = {
  homeUrl:string;
  appWidth?:number;
  appHeight?:number;
  appPosX?:number;
  appPosY?:number;
  proxy?:string;
}
export default class MainWindowManager {
  private options?: WinOptions;
  private botId: string;
  private mainWindow: BrowserWindow | null;
  private devTools: Devtool  | undefined;

  constructor(botId:string) {
    this.botId = botId
    this.mainWindow = null
  }
  setWinOptions(options:WinOptions){
    this.options = {
      ...this.options,
      ...options
    }
    return this
  }

  static checkInstance(botId: string) {
    console.log("[checkInstance]",Array.from(__managers.keys()),botId)
    return __managers.has(botId) && __managers.get(botId)!.mainWindow;
  }

  static getInstance(botId: string) {
    if(!__managers.has(botId)){
      __managers.set(botId,new MainWindowManager(botId))
    }
    return __managers.get(botId)!;
  }
  static closeWindow(botId:string){
    if(__managers.has(botId) && __managers.get(botId)!.mainWindow){
      __managers.get(botId)!.mainWindow!.close();
    }
  }
  static closeAllWindow(){
    let i = 0;
    __managers.forEach((manager, botId) => {
      if (manager.mainWindow) {
        manager.mainWindow.close();
        i++
      }
    });
    return i;
  }

  showWindow(){
    const t = this.getMainWindow()
    if(t){
      if(!t.isVisible()){
        t.show()
      }
      return
    }
  }

  moveTop(){
    const t = this.getMainWindow()
    if(t){
      t.moveTop()
      return
    }
  }

  async openChatBot(){
    const account = await new WorkerAccount(this.botId).get()
    if(account!.activeWindowOnOpenChat){
      this.activeWindow()
    }
  }
  activeWindow(){
    this.showWindow();
    const t = this.getMainWindow()
    if(t){
      if(t.isFocusable() && !t.isFocused()){
        t.focus()
      }
      this.moveTop()
      return
    }
  }
  reload(){
    if(this.mainWindow){
      this.mainWindow!.reload()
    }
  }
  goBack(){
    if(this.mainWindow && this.mainWindow.webContents && this.mainWindow.webContents.canGoBack()){
      this.mainWindow.webContents.goBack()
    }
  }
  getMainWindow(){
    return this.mainWindow!
  }

  static getMainWindowWebContents(botId:string){
    if(
      !MainWindowManager.getInstance(botId) ||
      !MainWindowManager.getInstance(botId).getMainWindow()||
      !MainWindowManager.getInstance(botId).getMainWindow().webContents
    ){
      return null
    }else{
      return MainWindowManager.getInstance(botId).getMainWindow().webContents!
    }
  }
  getOptions(){
    return this.options!
  }
  async init(){
    await this.create()
  }
  async create(){
    const options = this.getOptions()
    console.debug("init",options)
    const {
      homeUrl,
      appWidth,appHeight,appPosX,appPosY
    } = options
    this.mainWindow = new BrowserWindow({
      width: appWidth  || 300,
      height: appHeight  || 600,
      x: appPosX || 0,
      y: appPosY || 0,
      title: "",
      resizable:true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
        contextIsolation: true,
        additionalArguments: [
          `--botId=${this.botId}`,
          `--isProd=${isProd}`,
          `--homeUrl=${homeUrl}`,
        ],
        partition: `persist:Bot-chatGpt-${this.botId}`
      },
    });

    await this.setUpProxy();
    await this.loadUrl(homeUrl);
    this.setUpDevtools();
    this.addEvents();
    return this
  }
  setUpDevtools(){
    this.devTools = new Devtool(this.mainWindow!)
  }

  showDevTools(){
    if(this.devTools){
      this.devTools.open()
    }
  }
  async loadUrl (url:string){
    try{
      const account = await new WorkerAccount(this.botId).get() as LocalWorkerAccountType
      let userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.43'
      if(account && account.browserUserAgent){
        userAgent = account.browserUserAgent
      }
      await this.mainWindow!.loadURL(url,{
        userAgent
      })
    }catch (e:any){
      console.error("[ERROR] load url",e)
      await WindowEventsHandler.replyChatMsg(e.message,this.botId,[
        MsgHelper.buildLocalCancel()
      ])
      switch (e.code){
        case "ERR_INTERNET_DISCONNECTED":
          const htmlContent = getErrorHtmlPage({
            errorCode:e.code,
            errorMsg:e.message,
            url:e.url,
          });
          await this.mainWindow!.loadURL(`data:text/html;charset=utf-8,${encodeURI(htmlContent)}`);
          return
      }
    }
  }
  async setUpProxy(){
    const options = this.getOptions()
    const {proxy} = options

    const mainWindowSession = this.mainWindow?.webContents.session;
    const proxyConfig = getProxyConfigFromProxyConfStr(proxy)

    if(proxy && proxyConfig){
      await mainWindowSession!.setProxy(proxyConfig)
    }else {
      await mainWindowSession!.setProxy({ proxyRules: "direct://" });
    }
    return this
  }

  addEvents(){
    const {mainWindow} = this
    mainWindow?.webContents.session.webRequest.onBeforeRequest((details, callback) => {

      if (details.url.includes('blocked-domain.com')) {
        callback({ cancel: true });
        return;
      }
      if (details.url.includes('original-url.com')) {
        const modifiedURL = details.url.replace('original', 'modified');
        callback({ redirectURL: modifiedURL });
        return;
      }

      // Allow the request to proceed as-is
      callback({ cancel: false });
    });
    this.mainWindow!.webContents.on('console-message', (event, level, message, line, sourceId) => {
      if(!isProd){
        let func = ""
        if(sourceId && sourceId.includes("/")){
          func = sourceId.split("/").slice(sourceId.split("/").length -2 ).join("/")
          func += ":"+line
        }
        WindowEventsHandler.sendEventToMasterChat(
          MasterEventActions.DebugLogMessage,
          {
            name:`BOT_${this.botId}`,
            func,
            level:["DEBUG","INFO","WARNING","ERROR"][level],
            args:[message]
          }
        ).catch((e)=>{});
      }
    });

    mainWindow!.webContents.setWindowOpenHandler((details: HandlerDetails) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });
    mainWindow!.on('closed', (e: any) => {
      console.log("[CLOSED] mainWindow",this.botId)
      if(__managers.has(this.botId)){
        void WindowEventsHandler.sendEventToMasterChat(MasterEventActions.UpdateWorkerStatus, {
          statusBot: BotStatusType.OFFLINE,
          botId:this.botId
        })
        const manager = __managers.get(this.botId);
        if(manager){
          manager.getMainWindow().destroy();
        }
        __managers.delete(this.botId)
      }
    });

  }
  sendInputKeyboardEvent(type:'char' | 'keyUp' | 'keyDown',keyCode:string){
    this.mainWindow!.webContents.sendInputEvent({
      type: type,
      keyCode: keyCode,
    });
  }
  sendMouseEvent(payload:any){
    this.mainWindow!.webContents.sendInputEvent(payload);
  }
  async runJsCode(code:string){
    console.log("[runJsCode]",code)
    await this.mainWindow!.webContents.executeJavaScript(code)
  }
}
