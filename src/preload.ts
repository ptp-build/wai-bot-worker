import type { IpcRendererEvent } from 'electron';
import { contextBridge, ipcRenderer } from 'electron';
import RenderBridge from './render/RenderBridge';
import {
  ElectronAction,
  ElectronApi,
  ElectronEvent, LocalWorkerAccountType,
  MasterEventActions,
  MasterEvents,
  WindowActions,
  WindowDbActionData,
  WorkerEventActions,
  WorkerEvents,
} from './types';
import { setComponents } from './utils/electronCommon';
import BotWorkerCustom from './plugins/js/customeWorker';
import { MasterBotId } from './setting';
import BridgeMasterWindow from './bridge/BridgeMasterWindow';

const fs = require('fs');
const path = require('path');

const minimist = require('minimist');

const argv = minimist(process.argv.slice(2));
const userDataPath = argv['user-data-dir']

const isProd = argv['isProd'] === 'true'
const appPath = argv['app-path']
const pluginsJsPath = isProd ? path.join(appPath,"plugins","js") : path.join(appPath,'.webpack/main',"plugins","js")

let botId = argv['botId']
const isMasterChat = botId === Number(MasterBotId)

console.log("[Preload]",window.location.href)
console.log("[Preload] argv: ",argv)
console.log("[Preload] isProd: ",isProd)
console.log("[Preload] botId: ",botId)
console.log("[Preload] appPath: ",appPath)
console.log("[Preload] userDataPath: ",userDataPath)
console.log("[Preload] pluginsJsPath: ",pluginsJsPath)

setComponents(isProd,userDataPath)

async function readAppendFile(name:string,code_pre = ''){
  const filePath = (name === "lib_zepto.js") ? path.join(pluginsJsPath,"..","..","lib", name) : path.join(pluginsJsPath, name);
  let code = await fs.promises.readFile(filePath, 'utf8');
  code = ` 
    window['__dirname'] = "./"

    if(!window.module){
      window.module = {}
    }
    if(!window.module.exports){
      window.module.exports = {}
    }` + code_pre + code

  const script = document.createElement('script');
  // console.log("[readAppendFile]",name,code)
  script.textContent = code;
  document.body.appendChild(script);
}

const electronApi: ElectronApi = {
  invokeRenderBridgeAction:RenderBridge.callApi.bind(botId),
  invokeWorkerWindowAction: (botId,action:WorkerEventActions,payload) => ipcRenderer.invoke(WindowActions.WorkerWindowAction,botId,action,payload),
  invokeMasterWindowAction: (botId,action:MasterEventActions,payload) => ipcRenderer.invoke(WindowActions.MasterWindowAction,botId,action,payload),
  invokeWorkerWindowKeyboardEventAction: (botId,type,keyCode) => ipcRenderer.invoke(WindowActions.WorkerWindowKeyboardAction,botId,type,keyCode),
  invokeWorkerWindowMouseEventAction: (botId,payload:any) => ipcRenderer.invoke(WindowActions.WorkerWindowMouseAction,botId,payload),

  invokeWindowDbAction: (actionData:WindowDbActionData) => ipcRenderer.invoke(WindowActions.WindowDbAction,actionData),

  isFullscreen: () => ipcRenderer.invoke(ElectronAction.GET_IS_FULLSCREEN),
  installUpdate: () => ipcRenderer.invoke(ElectronAction.INSTALL_UPDATE),
  handleDoubleClick: () => ipcRenderer.invoke(ElectronAction.HANDLE_DOUBLE_CLICK),
  openNewWindow: (url: string) => ipcRenderer.invoke(ElectronAction.OPEN_NEW_WINDOW, url),

  on: (eventName: ElectronEvent | MasterEvents | WorkerEvents, callback) => {
    const subscription = (event: IpcRendererEvent, ...args: any) => callback(...args);
    ipcRenderer.on(eventName, subscription);
    return () => {
      ipcRenderer.removeListener(eventName, subscription);
    };
  },
};

contextBridge.exposeInMainWorld('electron', electronApi);

window.addEventListener('DOMContentLoaded', async () => {
  window.electron = electronApi
  if(!isMasterChat){
    const account = await new BridgeMasterWindow(botId.toString()).getWorkersAccount({botId:botId.toString()}) as LocalWorkerAccountType
    let {pluginJs} = account
    if(!pluginJs){
      pluginJs = "worker_custom.js"
    }
    let appendChild = true
    if(account && account.customWorkerUrl){
      const {customWorkerUrl} = account
      if(customWorkerUrl!.includes("twitter") || customWorkerUrl!.includes("discord")){
        appendChild = false
      }
    }
    if(appendChild){
      await readAppendFile("lib_zepto.js","")
      await readAppendFile(pluginJs, `window.WORKER_ACCOUNT = ${JSON.stringify(account)};`)
      if(!isProd){
        await readAppendFile("testCase.js",`window.WORKER_ACCOUNT = ${JSON.stringify(account)};`)
      }
    }else{
      new BotWorkerCustom(account).addEvents()
    }
  }
});
