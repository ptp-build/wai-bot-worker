import { app, BrowserWindow, session } from 'electron';
import * as path from 'path';
import { getProxyConfig, parseAppArgs,DefaultPartition } from './utils/args';
import { getErrorHtml } from './utils/utils';
import ElectronIpcMain from './services/ElectronIpcMain';
import Devtool from './ui/Devtool';
import Ui from './ui/Ui';
import { BotWsServer } from './services/BotWsServer';
import { BotWsClient } from './services/BotWsClient';
import { BotWsClientAgent } from './services/BotWsClientAgent';


const appArgs = parseAppArgs();
let {
  appWidth,
  appHeight,
  appPosX,
  appPosY,
  homeUrl,
  useProxy,
  partitionName,
} = appArgs;

let homePageLoaded = false
const proxyConfig = getProxyConfig(appArgs)
let mainWindow: BrowserWindow | null;
let devTools:Devtool;
let botWsServer:BotWsServer | undefined;
let botWsClient:BotWsClient | undefined;
let botWsClientAgent:BotWsClientAgent

const loadLocalPage =async (page?:string)=>{
  await mainWindow!.loadFile(path.join(__dirname, 'electron','assets', page || 'index.html'));
}

const loadUrl = async (url:string)=>{
  try{
    await mainWindow!.loadURL(url)
  }catch (e){
    //@ts-ignore
    const htmlContent = getErrorHtml(e,useProxy,proxyConfig);
    await mainWindow!.loadURL(`data:text/html;charset=utf-8,${encodeURI(htmlContent)}`);
  }
}

export function sendToRenderMsg(action:string,payload?:any){
  mainWindow!.webContents.send("ipcRenderMsg", action,payload);
}


export function sendToMainMsg(action:string,payload?:any){

}

export async function runJsCode(code:string){
  console.log("[runJsCode]",code)
  await mainWindow!.webContents.executeJavaScript(code)
}
const isDefaultPartition = partitionName === DefaultPartition
if(isDefaultPartition){
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
}
const createWindow = (): void => {
  if (mainWindow) {
    mainWindow.focus();
    return;
  }
  if(devTools){
    devTools.close()
  }

  if(partitionName === DefaultPartition){
    const ses = session.fromPartition(partitionName);
    console.log("ses.isPersistent",ses.isPersistent()) // true
    console.log("ses.storagePath",ses.getStoragePath())
  }
  mainWindow = new BrowserWindow({
    width: appWidth,
    height: appHeight,
    x: appPosX,
    y: appPosY,
    title: '-',
    webPreferences: {
      preload: path.join(__dirname, 'js', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      partition: partitionName === DefaultPartition ? undefined : partitionName
    },
  });

  loadLocalPage("index.html");
  const loadHomePage = async ()=>{
    if (useProxy) {
      const mainWindowSession = mainWindow!.webContents.session;
      await session.defaultSession.setProxy(proxyConfig)
      await mainWindowSession.setProxy(proxyConfig)
      await loadUrl(homeUrl)
    }else{
      await loadUrl(homeUrl)
    }
  }
  mainWindow.webContents.on('did-finish-load', async () => {
    const displaySize = Ui.getDisplaySize(mainWindow!)
    console.log("[displaySize]",displaySize)
    mainWindow!.webContents.on('console-message', (event, level, message, line, sourceId) => {
      if(
        message.includes("font-weight: bold; This renderer process has either ") ||
        message.includes("console.groupEnd") ||
        message.includes("xxx callApi('") ||
        message.includes("%c%d font-size:0;color:transparent NaN")

      ){
        return
      }
      if(appArgs.startBotWsClient){
        console.log('[Console] > ', message);
      }
    });
    mainWindow!.webContents.send('inject-scripts');

    if(!homePageLoaded){
      homePageLoaded = true
      await loadHomePage()
    }
  });
  devTools = new Devtool(mainWindow,appArgs)
  devTools.open()

  mainWindow.on('resize', () => {
    const [width, height] = mainWindow!.getSize();
    const [x,y] = mainWindow!.getPosition();
    //console.log(`New window size: {width:${width}, height: ${height}},x:${x},y:${y}`);
  });

  mainWindow.on('move', () => {
    const [x,y] = mainWindow!.getPosition();
    //console.log(`New window position: x:${x},y:${y}`);
  });

  mainWindow.on('closed', (e: any) => {
    console.log("[window close]");
    //mainWindow = null;
  });
};
if(isDefaultPartition){
  if (!app.requestSingleInstanceLock()) {
    app.quit();
  } else {
    app.on('second-instance', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        createWindow();
      }
    });
  }
}
app.on('ready', async () => {
  createWindow();
  if(appArgs.startBotWsServer){
    botWsServer = await new BotWsServer().setMsgHandler({
      sendToRenderMsg,
      sendToMainMsg
    }).start(appArgs)
  }
  if(appArgs.startBotWsClient){
    botWsClient = await new BotWsClient().setMsgHandler({
      sendToRenderMsg,
      sendToMainMsg
    }).start(appArgs)
    botWsClientAgent = await new BotWsClientAgent().setMsgHandler({
      sendToRenderMsg,
      sendToMainMsg
    }).start(appArgs)
  }
  new ElectronIpcMain(mainWindow!).setSendToRenderMsgHandler(sendToRenderMsg).addEvents()

});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log("before-quit")
  // if(botWsServer){
  //   botWsServer.close()
  // }
  // if(botWsClient){
  //   botWsClient.close()
  // }
  // if(botWsClientAgent){
  //   botWsClientAgent.close()
  // }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
