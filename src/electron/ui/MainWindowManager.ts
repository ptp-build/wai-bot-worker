import { app, BrowserWindow,session } from 'electron';
import { AppArgvType, DefaultPartition, getProxyConfig } from '../utils/args';
import path from 'path';
import { getErrorHtml } from '../utils/utils';
import Ui from './Ui';
import ElectronIpcMain from '../services/events/ElectronIpcMain';
import Devtool from './Devtool';
import { startServers } from '../../server/server';

export const MasterWindowBotId = "1"

let __managers = new Map<string, MainWindowManager>();

const PRELOAD_JS = path.join(__dirname, 'electron','js', 'preload.js')

export default class MainWindowManager {
  private botId: string;
  private mainWindow: BrowserWindow | null;
  private devTools: Devtool  | undefined;
  private options?: AppArgvType;
  private isMaster: boolean;

  constructor(botId:string) {
    this.botId = botId
    this.mainWindow = null
    this.isMaster = botId === MasterWindowBotId
  }

  static checkInstance(botId: string) {
    return __managers.has(botId);
  }
  static getInstance(botId: string) {
    if(!__managers.has(botId)){
      __managers.set(botId,new MainWindowManager(botId))
    }
    return __managers.get(botId)!;
  }
  static closeAllWindow(){
    __managers.forEach((manager, botId) => {
      if (botId !== MasterWindowBotId && manager.mainWindow) {
        manager.mainWindow.close();
      }
    });
  }
  getMainWindow(){
    return this.mainWindow!
  }
  getOptions(){
    return this.options!
  }
  async init(options:AppArgvType){
    this.options = options
    await this.create()
  }
  async create(){
    const options = this.getOptions()
    console.debug("[options]",options)
    this.mainWindow = new BrowserWindow({
      width: options.appWidth,
      height: options.appHeight,
      x: options.appPosX,
      y: options.appPosY,
      title: '-',
      resizable:this.isMaster,
      webPreferences: {
        preload: PRELOAD_JS,
        nodeIntegration: true,
        contextIsolation: true,
        additionalArguments: [
          this.botId,
          `chatGptUsername=${options.chatGptUsername || ""}`,
          `chatGptPassword=${options.chatGptPassword || ""}`,
        ],
        partition: options.partitionName === DefaultPartition ? undefined : options.partitionName
      },
    });
    await this.setUpProxy();
    this.addEvents()
    await this.loadUrl(options.homeUrl);
    this.setUpDevtools();
    return this
  }
  setUpDevtools(){
    this.devTools = new Devtool(this.mainWindow!,this.getOptions())
    this.devTools.open()
  }

  async loadLocalPage (page:string){
    await this.mainWindow!.loadFile(path.join(__dirname, 'electron','assets', page || 'index.html'));
  }

  async loadUrl (url:string){
    try{
      if(url.startsWith("http")){
        await this.mainWindow!.loadURL(url)
      }else{
        await this.loadLocalPage(url)
      }
    }catch (e:any){
      const {useProxy} = this.getOptions()
      const proxyConfig = getProxyConfig(this.getOptions())
      //@ts-ignore
      const htmlContent = getErrorHtml(e,!!useProxy,proxyConfig);
      await this.mainWindow!.loadURL(`data:text/html;charset=utf-8,${encodeURI(htmlContent)}`);
    }
  }
  async setUpProxy(){
    const options = this.getOptions()
    const {useProxy} = options
    if (useProxy) {
      const proxyConfig = getProxyConfig(options)
      const mainWindowSession = this.mainWindow!.webContents.session;
      await session.defaultSession.setProxy(proxyConfig)
      await mainWindowSession.setProxy(proxyConfig)
    }
    return this
  }
  addEvents(){
    const {mainWindow} = this
    this.mainWindow!.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.debug(" =>",`${this.botId}`,message)
    });
    mainWindow!.webContents.on('did-finish-load', async () => {
      const displaySize = Ui.getDisplaySize(mainWindow!)
      console.log("[displaySize]",displaySize)
    });

    mainWindow!.on('resize', () => {
      const [width, height] = mainWindow!.getSize();
      const [x,y] = mainWindow!.getPosition();
      // console.log(`mainWindow resize: {width:${width}, height: ${height}},x:${x},y:${y}`);
    });

    mainWindow!.on('move', () => {
      const [x,y] = mainWindow!.getPosition();
      // console.log(`mainWindow move: x:${x},y:${y}`);
    });

    mainWindow!.on('closed', (e: any) => {
      if(__managers.has(this.botId)){
        __managers.delete(this.botId)
      }
      console.log(`mainWindow closed`);
      if(this.botId === MasterWindowBotId){
        app.quit()
      }
    });

    if(this.botId === MasterWindowBotId){
      ElectronIpcMain.addEvents()
      if(this.getOptions().startWsServer){
        const userDataPath = app.getPath('userData');
        startServers(this.getOptions().waiServerTcpPort, this.getOptions().waiServerWsPort,this.getOptions().waiServerHttpPort,userDataPath);
      }

      if(this.getOptions().waiServerRqaPort){

      }
    }
  }
  async loadHomePage(){
    const {homeUrl} = this.getOptions()
    await this.loadUrl(homeUrl)
  }
  async sendToRenderMsg(action:string,payload?:any){
    await this.mainWindow!.webContents.send("ipcRenderMsg", action,payload);
  }
  async runJsCode(code:string){
    console.log("[runJsCode]",code)
    await this.mainWindow!.webContents.executeJavaScript(code)
  }
}
