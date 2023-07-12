import { getElectronEnv } from '../../utils/electronEnv';
import path from 'path';
import { shell } from 'electron';
import {
  CallbackButtonAction,
  CallbackButtonRequest,
  ChatGptModelType,
  LocalWorkerAccountType,
  LocalWorkerBotType,
  LocalWorkerType,
  MasterEventActions,
} from '../../sdk/types';
import MainWindowManager from '../../ui/MainWindowManager';
import { User } from '../../worker/models/user/User';
import WindowEventsHandler from './WindowEventsHandler';
import WorkerAccount from '../woker/WorkerAccount';
import { getCustomWorkerHtml } from '../../ui/Ui';
import { MasterBotId } from '../../sdk/setting';
import { parseCallBackButtonPayload } from '../../sdk/common/string';
import MasterActions from './MasterActions';
import BigStorage from '../../worker/services/storage/BigStorage';

export default class MasterWindowCallbackAction {

  async callbackButtonAction(data:string){
    const {path,params} = parseCallBackButtonPayload(data)
    switch (path as CallbackButtonAction){
      case CallbackButtonAction.Master_openMessageDoc:
        await this.openMessageDoc(params)
        break
      case CallbackButtonAction.Master_createCustomWorker:
        await this.createWorkerBot(params)
        break
      case CallbackButtonAction.Master_restartWorker:
        await this.restartWorker(params.botId || params.chatId )
        break
      case CallbackButtonAction.Master_OpenWorkerWindow:
        await this.openWorkerWindow(params.botId || params.chatId )
        break
      case CallbackButtonAction.Master_closeWorkerWindow:
        await this.closeWorkerWindow(params.botId || params.chatId)
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

  async restartWorker(botId:string) {
    return MasterActions.restartWorkerWindow(botId)
  }
  async openWorkerWindow(chatId:string) {
    let account = await new WorkerAccount(chatId).get() as LocalWorkerAccountType
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
  async createWorkerBot({type,botType,chatGptModel,customWorkerUrl,pluginJs}:{type:LocalWorkerType,chatGptModel?:ChatGptModelType,botType:LocalWorkerBotType,customWorkerUrl?:string,pluginJs:string}){
    const botId = await User.genUserId()
    let appWidth = 300
    const {username,name} = WorkerAccount.getDefaultName(botId,type)
    if(customWorkerUrl
      &&
      (
        customWorkerUrl.indexOf("twitter") > 0
        || customWorkerUrl.indexOf("proton") > 0
      )
    ){
      appWidth = 900
    }
    const account = {
      botId,
      bio:"",
      username,
      name,
      type:type,
      appWidth,
      appHeight:600,
      appPosX: 0,
      appPosY: 0,
      botType,
      chatGptModel,
      customWorkerUrl:customWorkerUrl || "",
      pluginJs,
    }

    await new WorkerAccount(botId).update(account)
    await WorkerAccount.addBotList(botId)
    await WindowEventsHandler.sendEventToMasterChat(MasterEventActions.CreateWorker,{
      account
    })
    switch (type){
      case 'bot':
        break
      default:
        await this.initWindow(account)
        break
    }
  }
  async createWorker(type:LocalWorkerType) {
    let account = await new WorkerAccount(MasterBotId).get() as LocalWorkerAccountType
    const botId = await User.genUserId()
    const {username,name} = WorkerAccount.getDefaultName(botId,type)
    let pluginJs = "worker_custom.js";

    switch (type){
      case 'bot':
        pluginJs = "bot_custom.js"
        break
      case 'chatGpt':
        pluginJs = "worker_chatGpt.js"
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
      chatGptAuth:type === "chatGpt" ? (account?.chatGptAuth || "") : "",
      taskWorkerUri:account?.taskWorkerUri || "",
      customWorkerUrl:account?.customWorkerUrl || "",
      pluginJs,
      proxy:account?.proxy || "",
    }
    if(type === "chatGpt"){
      account.customWorkerUrl = "https://chat.openai.com"
    }
    await new WorkerAccount(botId).update(account)
    await WorkerAccount.addBotList(botId)
    await WindowEventsHandler.sendEventToMasterChat(MasterEventActions.CreateWorker,{
      account
    })
    switch (type){
      case 'bot':
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
    MainWindowManager.getInstance(account!.botId).moveTop()
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

  async openMessageDoc({docId}:{docId:string}){
    // console.log(docId)
    if(docId){
      const filePath = MasterActions.getFilePath(docId)
      console.log(filePath)
      const fullPath = BigStorage.getInstance().getFullPath(filePath)
      console.log(fullPath)
      shell.openPath(fullPath).catch((error) => {
        console.error(`Failed to open directory: ${error}`);
      });
    }
  }
}
