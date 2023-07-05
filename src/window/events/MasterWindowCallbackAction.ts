import {getElectronEnv} from '../../utils/electronEnv';
import path from 'path';
import {shell} from 'electron';
import {
  CallbackButtonAction,
  CallbackButtonRequest,
  LocalWorkerAccountType,
  LocalWorkerType,
  MasterEventActions,
} from "../../types";
import MainWindowManager from "../../ui/MainWindowManager";
import {MasterBotId} from "../../setting";
import {User} from "../../worker/models/user/User";
import {parseCallBackButtonPayload} from "../../utils/utils";
import WindowEventsHandler from "./WindowEventsHandler";
import WorkerAccount from "../woker/WorkerAccount";
import {getCustomWorkerHtml, getTaskWorkerHtml} from "../../ui/Ui";

export default class MasterWindowCallbackAction {

  async callbackButtonAction(data:string){
    const {path,params} = parseCallBackButtonPayload(data)
    switch (path){
      case CallbackButtonAction.Master_createCustomWorker:
        await this.createWorker("custom")
        break
      case CallbackButtonAction.Master_createCodingWorker:
        await this.createWorker("coding")
        break
      case CallbackButtonAction.Master_createTaskWorker:
        await this.createWorker("taskWorker")
        break
      case CallbackButtonAction.Master_createChatGptBotWorker:
        await this.createWorker("chatGpt")
        break
      case CallbackButtonAction.Master_OpenWorkerWindow:
        await this.openWorkerWindow(params.chatId)
        break
      case CallbackButtonAction.Master_closeWorkerWindow:
        await this.closeWorkerWindow(params.chatId)
        break
      case CallbackButtonAction.Master_openUserAppDataDir:
        await this.openUserAppDataDir(params)
        break
      case CallbackButtonAction.Master_openPluginDir:
        await this.openPluginDir(params)
        break
      case CallbackButtonAction.Master_closeAllWindow:
        await this.closeAllWindow(params)
        break
      case CallbackButtonAction.Master_appInfo:
        await this.appInfo(params)
        break
    }
  }

  async closeAllWindow(params:CallbackButtonRequest){
    const len = MainWindowManager.closeAllWindow()
    await WindowEventsHandler.replyChatMsg(`Closed window num: ${len} `,params.chatId)
  }

  async closeWorkerWindow(chatId:string){
    MainWindowManager.closeWindow(chatId)
  }

  async openWorkerWindow(chatId:string) {
    let account = await new WorkerAccount(chatId).getWorkersAccount() as LocalWorkerAccountType
    if(MainWindowManager.checkInstance(account!.botId)){
      console.log("MainWindowManager exists",account!.botId)
      if(MainWindowManager.getInstance(account!.botId).getMainWindow()){
        try{
          MainWindowManager.getInstance(account!.botId).activeWindow()
          return
        }catch (e){
          console.log('[activeWindow] error',e)
        }
      }
    }
    await this.initWindow(account)
  }
  async createWorker(type:LocalWorkerType) {
    let account = await new WorkerAccount(MasterBotId).getWorkersAccount() as LocalWorkerAccountType
    const botId = await User.genUserId()
    let username = "";
    let name = "";
    let pluginJs = "worker_custom.js";

    switch (type){
      case 'coding':
        username = `Coding_${botId}_bot`;
        name = `Coding #${botId}`
        pluginJs = "worker_coding.js"
        break
      case 'chatGpt':
        username = `ChatGpt_${botId}_bot`;
        name = `ChatGpt #${botId}`
        pluginJs = "worker_chatGpt.js"
        break
      case 'taskWorker':
        username = `TaskWorker_${botId}_bot`;
        name = `TaskWorker #${botId}`
        break
      case 'custom':
        username = `CustomWorker_${botId}_bot`;
        name = `CustomWorker #${botId}`
        break
    }
    account = {
      botId,
      bio:"",
      username,
      name,
      type:type,
      appWidth:300,
      appHeight:600,
      appPosX: 0,
      appPosY: 0,
      chatGptAuth:account?.chatGptAuth || "",
      taskWorkerUri:account?.taskWorkerUri || "",
      customWorkerUrl:account?.customWorkerUrl || "",
      pluginJs,
      proxy:account?.proxy || "",
    }
    await new WorkerAccount(botId).updateWorkersAccount(account)
    await WorkerAccount.addBotList(botId)
    await WindowEventsHandler.sendEventToMasterChat(MasterEventActions.CreateWorker,{
      account
    })
    switch (type){
      case 'coding':
        break
      default:
        await this.initWindow(account)
        break
    }
  }
  async initWindow(account:LocalWorkerAccountType){
    let homeUrl = ""
    switch (account.type){
      case 'chatGpt':
        homeUrl = "https://chat.openai.com"
        break
      case 'taskWorker':
        homeUrl = `data:text/html;charset=utf-8,${encodeURI(getTaskWorkerHtml())}`
        break
      case 'custom':
        homeUrl = account.customWorkerUrl ? account.customWorkerUrl : `data:text/html;charset=utf-8,${encodeURI(getCustomWorkerHtml())}`
        break

    }
    await MainWindowManager.getInstance(account!.botId).setWinOptions({
      homeUrl,
      appWidth:account!.appWidth,
      appHeight:account!.appHeight,
      appPosX:account!.appPosX,
      appPosY:account!.appPosY,
      proxy:account!.proxy,
    }).init()
  }
  async appInfo(params:CallbackButtonRequest){
    const electron_env = getElectronEnv()
    const electron_env_str = "```json\n" + JSON.stringify(electron_env, null, 2) + "```"
    const text = `electronEnv:\n${electron_env_str}`
    return await WindowEventsHandler.replyChatMsg(text,params.chatId)
  }

  async openUserAppDataDir(params:{chatId:string}){
    let {userDataPath} = getElectronEnv()

    shell.openPath(userDataPath).catch((error) => {
      console.error(`Failed to open directory: ${error}`);
    });
  }

  async openPluginDir(params:CallbackButtonRequest){
    let {appDataPath} = getElectronEnv()
    const pluginDir = path.join(appDataPath,"plugins")
    await WindowEventsHandler.replyChatMsg(`pluginDir: ${pluginDir} `,params.chatId)
    console.log("openPluginDir",pluginDir)
    shell.openPath(pluginDir).catch((error) => {
      console.error(`Failed to open directory: ${error}`);
    });
  }
}
