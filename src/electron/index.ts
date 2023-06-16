import { app, BrowserWindow, session,dialog } from 'electron';
import * as path from 'path';
import { DefaultPartition, getProxyConfig, parseAppArgs } from './utils/args';
import { getErrorHtml } from './utils/utils';
import ElectronIpcMain from './services/ElectronIpcMain';
import Devtool from './ui/Devtool';
import Ui from './ui/Ui';
import ElectronService from './ElectronService';
import { ignoreConsoleMessage, setUpLogs } from './utils/logs';
import { isPortInUse } from './utils/server';

const userDataPath = app.getPath('userData');

const appArgs = parseAppArgs();
let {
  appWidth,
  appHeight,
  appPosX,
  appPosY,
  homeUrl,
  useProxy,
  partitionName,
  accountId,
  startWsServer
} = appArgs;

const logLevel = "debug"
console.debug("[AppArgs]",appArgs)
console.log("[userDataPath]",userDataPath)

setUpLogs(String(!startWsServer ? accountId : "default"),logLevel,userDataPath)

let homePageLoaded = false
const proxyConfig = getProxyConfig(appArgs)
let mainWindow: BrowserWindow | null;
let devTools:Devtool;
let electronServer:ElectronService

export const loadLocalPage =async (page?:string)=>{
  await mainWindow!.loadFile(path.join(__dirname, 'electron','assets', page || 'index.html'));
}

export const loadUrl = async (url:string)=>{
  try{
    if(url.startsWith("http")){
      await mainWindow!.loadURL(url)
    }else{
      await loadLocalPage(url)
    }

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
const createWindow = (): void => {
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
    resizable: partitionName === DefaultPartition,
    movable: partitionName === DefaultPartition,
    webPreferences: {
      preload: path.join(__dirname, 'electron','js', 'preload.js'),
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
      if(!ignoreConsoleMessage(message)){
        console.log('>>', message);
      }
    });
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
    console.log(`New window size: {width:${width}, height: ${height}},x:${x},y:${y}`);
  });

  mainWindow.on('move', () => {
    const [x,y] = mainWindow!.getPosition();
    console.log(`New window position: x:${x},y:${y}`);
  });

  mainWindow.on('closed', (e: any) => {
    app.quit(); // This quits the application completely
  });
};

app.on('ready', async () => {
  // if(appArgs.startWsServer && await isPortInUse(appArgs.waiServerWsPort)){
  //   const options = {
  //     type: 'error',
  //     buttons: ['Ok'],
  //     defaultId: 0,
  //     title: 'Error',
  //     message: 'The server is already running on this port.',
  //     detail: 'Please stop the existing server before trying again.',
  //   };
  //
  //   dialog.showMessageBox(options).then(() => {
  //     app.quit();
  //   });
  //
  //   return
  // }
  createWindow();
  new ElectronIpcMain(mainWindow!).setSendToRenderMsgHandler(sendToRenderMsg).addEvents()
  electronServer = await new ElectronService(appArgs).start(userDataPath)
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log("before-quit")
});
