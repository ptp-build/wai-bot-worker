import type {IpcRendererEvent} from 'electron';
import {contextBridge, ipcRenderer} from 'electron';
import Bridge from "./render/Bridge";
import KvCache from "./worker/services/kv/KvCache";
import BigStorage from "./worker/services/storage/BigStorage";
import LocalFileKv from "./worker/services/kv/LocalFileKv";
import FileStorage from "./worker/services/storage/FileStorage";
import {
  ElectronApi,
  MasterEventActions,
  MasterEvents,
  WindowActions,
  WindowDbActionData,
  WorkerEventActions,
  WorkerEvents,
} from './types';
import WorkerAccount from "./window/woker/WorkerAccount";

const fs = require('fs');
const path = require('path');

const minimist = require('minimist');

const argv = minimist(process.argv.slice(2));
const userDataPath = argv['user-data-dir']

const isProd = argv['isProd'] === 'true'
const appPath = argv['app-path']
const pluginsJsPath = isProd ? path.join(appPath,"plugins","js") : path.join(appPath,'.webpack/main',"plugins","js")

let botId = argv['botId']

console.log("[Preload]",window.location.href)
console.log("[Preload] argv: ",argv)
console.log("[Preload] isProd: ",isProd)
console.log("[Preload] botId: ",botId)
console.log("[Preload] appPath: ",appPath)
console.log("[Preload] userDataPath: ",userDataPath)
console.log("[Preload] pluginsJsPath: ",pluginsJsPath)

KvCache.getInstance().setKvHandler(new LocalFileKv().init(userDataPath))
BigStorage.getInstance().setKvHandler(new FileStorage().init(userDataPath))

async function readAppendFile(name:string,code_pre = ''){
  try {

    const filePath = (name === "lib_zepto.js") ? path.join(pluginsJsPath,"..","..","lib", name) : path.join(pluginsJsPath, name);
    const code = await fs.promises.readFile(filePath, 'utf8');
    const script = document.createElement('script');
    script.textContent = code_pre + code;
    document.body.appendChild(script);
  } catch (err) {
    console.error(`Error reading ${name}:`, err);
  }
}

const electronApi: ElectronApi = {
  invokeRenderBridgeAction:Bridge.callApi.bind(botId),
  invokeWorkerWindowAction: (botId,action:WorkerEventActions,payload) => ipcRenderer.invoke(WindowActions.WorkerWindowAction,botId,action,payload),
  invokeMasterWindowAction: (botId,action:MasterEventActions,payload) => ipcRenderer.invoke(WindowActions.MasterWindowAction,botId,action,payload),
  invokeWorkerWindowKeyboardEventAction: (botId,type,keyCode) => ipcRenderer.invoke(WindowActions.WorkerWindowKeyboardAction,botId,type,keyCode),
  invokeWorkerWindowMouseEventAction: (botId,payload:any) => ipcRenderer.invoke(WindowActions.WorkerWindowMouseAction,botId,payload),

  invokeWindowDbAction: (actionData:WindowDbActionData) => ipcRenderer.invoke(WindowActions.WindowDbAction,actionData),

  on: (eventName: MasterEvents | WorkerEvents, callback) => {
    const subscription = (event: IpcRendererEvent, ...args: any) => callback(...args);
    ipcRenderer.on(eventName, subscription);
    return () => {
      ipcRenderer.removeListener(eventName, subscription);
    };
  },
};

contextBridge.exposeInMainWorld('electron', electronApi);

window.addEventListener('DOMContentLoaded', async () => {
  await readAppendFile("lib_zepto.js")
  if(botId > 1 && botId !== 1000){
    const account = await new WorkerAccount(botId).getWorkersAccount()
    if(!account){
      return
    }
    console.debug("[Preload] account: ",account)
    await readAppendFile(`worker_${account.type}.js`, `window.__worker_account = ${JSON.stringify(account)};`)
  }
});
