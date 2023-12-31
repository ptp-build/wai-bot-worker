import {BrowserWindow} from 'electron';
import path from 'path';
import {getProxyConfigFromProxyConfStr} from "../utils/utils";
import Devtool from "./Devtool";
import {getErrorHtml} from "./Ui";
import {isProd} from "../utils/electronEnv";
import WindowEventsHandler from "../window/events/WindowEventsHandler";
import {BotStatusType, BotWorkerStatusType, MasterEventActions} from "../types";

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

  moveTop(){
    const t = this.getMainWindow()
    if(t){
      t.moveTop()

      return
    }
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
  activeWindow(){
    console.log("[activeWindow]",this.botId,!!this.getMainWindow())
    this.showWindow();
    const t = this.getMainWindow()
    if(t){
      if(t.isFocusable() && !t.isFocused()){
        t.focus()
      }
      return
    }
  }
  reload(){
    if(this.mainWindow){
      this.mainWindow!.reload()
    }
  }
  getMainWindow(){
    return this.mainWindow!
  }

  getMainWindowWebContents(){
    if(!this.mainWindow){
      return null
    }else{
      return this.mainWindow!.webContents
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

  async loadUrl (url:string){
    try{
      await this.mainWindow!.loadURL(url,{
        userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.43'
      })
    }catch (e:any){
      const {proxy} = this.getOptions()
      const htmlContent = getErrorHtml(this.botId,e,proxy);
      await this.mainWindow!.loadURL(`data:text/html;charset=utf-8,${encodeURI(htmlContent)}`);
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

    mainWindow!.on('closed', (e: any) => {
      console.log("[CLOSED] mainWindow",this.botId)
      if(__managers.has(this.botId)){
        WindowEventsHandler.sendEventToMasterChat(MasterEventActions.UpdateWorkerStatus, {
          statusBot: BotStatusType.OFFLINE,
          statusBotWorker: BotWorkerStatusType.WaitToReady,
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
