import { isProd, parseAppArgs } from '../../utils/args';
import Ui, { getAppPosition } from '../../ui/Ui';
import MainWindowManager from '../../ui/MainWindowManager';
import { parseCallBackButtonPayload } from '../../utils/utils';
import { BotWsClient } from '../BotWsClient';
import { getElectronEnv } from '../../utils/electronEnv';
import PyAutoGuiRpa from '../PyAutoGuiRpa';
import path from 'path';
const { shell } = require('electron');

const IpcMainCallbackButtonAction = "ipcMainCallbackButton";

export default class MainEvents {
  private __id:number;
  private botId:string;
  constructor(accountId:string,__id:number) {
    this.botId = accountId;
    this.__id = __id;
  }
  sendAction(text:string,payload?:any){
    return MainWindowManager.getInstance(this.botId).sendToRenderMsg(IpcMainCallbackButtonAction,{
      text,
      payload,
      __id:this.__id
    })
  }

  async createChatGptBotWorker(data: string) {
    const eventData = parseCallBackButtonPayload(data)
    let {botId,isCreate,accountNum,proxy,chatGptAuthUser} = eventData
    console.log("[createChatGptBotWorker]",eventData)
    accountNum = accountNum || 0
    accountNum += 1
    const {appSubWidth,appSubHeight,windowGap} = parseAppArgs()
    const {displayHeight,displayWidth} = Ui.getDisplaySizeFromCache()
    const appWidth = eventData.appWidth || appSubWidth
    const appHeight = eventData.appHeight || appSubHeight
    let appPosY;
    let appPosX;
    if(isCreate){
      const resPost = getAppPosition(accountNum,displayWidth,displayHeight,appWidth,appHeight,windowGap)
      if(!resPost){
        this.sendAction("窗口数量过多");
        return
      }
      appPosX = resPost.appPosX
      appPosY = resPost.appPosY
    }else{
      if(MainWindowManager.checkInstance(botId)){
        this.sendAction("窗口已打开");
        return
      }
      appPosX = eventData.appPosX
      appPosY = eventData.appPosY
    }

    let chatGptUsername = "",chatGptPassword = ""
    if(chatGptAuthUser && chatGptAuthUser.includes(":")){
      chatGptUsername = chatGptAuthUser.split(":")[0]
      chatGptPassword = chatGptAuthUser.split(":")[1]
    }

    let proxyType = "",proxyIp = "",proxyPort="",proxyUsername = "",proxyPassword="";
    let useProxy = !!proxy
    if(useProxy){
      if(proxy.split("://").length > 1){
        proxyType = proxy.split("://")[0]
        const proxyOther = proxy.split("://")[1]
        if(proxyOther.split("@").length > 1){
          proxyIp = proxyOther.split("@")[0].split(":")[0]
          proxyPort = proxyOther.split("@")[0].split(":")[1]
          proxyUsername = proxyOther.split("@")[1].split(":")[0]
          proxyPassword = proxyOther.split("@")[1].split(":")[1]
        }
      }
    }
    if(proxyIp && proxyPort && proxyUsername && proxyPassword && proxyType){
      useProxy = true
    }
    const homeUrl = "https://chat.openai.com"

    try {
      this.sendAction("",{
        type:"chatGpt",
        isCreate,
        botId:eventData.botId,
        proxy,chatGptAuthUser,
        appWidth,appHeight,appPosX,appPosY
      });
      const partitionName = `persist:Bot_chatGpt_${botId}`

      await MainWindowManager.getInstance(botId).init({
        ...parseAppArgs(),
        partitionName,
        homeUrl,
        appWidth,
        appHeight,
        appPosX,
        appPosY,
        chatGptUsername,
        chatGptPassword,
        useProxy,
        proxyType,
        proxyIp,
        proxyPort,
        proxyUsername,
        proxyPassword,
      })
    }catch (e){
      console.warn("[createChatGptBotWorker][runCommand error]")
    }
  }

  getAdvanceInlineButtons(data:string,paload:any){
    const chatId = data.split("/")[data.split("/").length - 1]
    const isMaster = chatId === "1000";
    let inlineButtons = [
      [
        {
          type:"callback",
          text:isMaster ? "创建 ChatGpt Bot Worker" : "打开窗口",
          data:"local/createChatGptBotWorker"
        },
      ],
      [
        {
          type:"callback",
          text:"ChatGpt用户名密码",
          data:"local/setUpChatGptAuthUser"
        },
      ],


    ];
    if(isMaster){
      inlineButtons.push([
        {
          type:"callback",
          text:"设置代理",
          data:"local/setUpProxy"
        },
        {
          type:"callback",
          text:"获取App信息",
          data:"ipcMain/appInfo"
        }
      ])
      inlineButtons.push([
        {
          type:"callback",
          text:"关闭所有窗口",
          data:"ipcMain/closeAllWindow"
        },
        {
          type:"callback",
          text:"清空所有窗口",
          data:"local/clearAllWindow"
        },
      ])
      inlineButtons.push([
        {
          type:"callback",
          text:"JS目录",
          data:"ipcMain/openJsDir"
        },
        {
          type:"callback",
          text:"应用数据目录",
          data:"ipcMain/openUserAppDataDir"
        },

      ])
    }else{
      inlineButtons.push([
        {
          type:"callback",
          text:"设置代理",
          data:"local/setUpProxy"
        }
      ])
    }
    return MainWindowManager.getInstance(this.botId).sendToRenderMsg(IpcMainCallbackButtonAction,{
      ...paload,
      text:"本地机器人",
      inlineButtons
    })
  }

  async ipcMainCallbackButton({data,...payload}:{__id:number,data:string,eventData?:any}){
    if(data.startsWith("ipcMain/startWsClient/")){
      const {msgServer,accountId,accountSign} = parseCallBackButtonPayload(data)
      await new BotWsClient().start(msgServer,accountId,accountSign)
      return
    }

    if(data.includes("getButtons")){
      return this.getAdvanceInlineButtons(data,payload);
    }
    if(data.startsWith("ipcMain/createChatGptBotWorker/")){
      return await this.createChatGptBotWorker(data)
    }
    switch (data){
      case "ipcMain/openUserAppDataDir":
        await this.openUserAppDataDir(payload.eventData!)
        break
      case "ipcMain/openJsDir":
        await this.openJsDir(payload.eventData!)
        break
      case "ipcMain/getSize":
        await this.handlePosition(payload.eventData!)
        break
      case "ipcMain/closeAllWindow":
        await MainWindowManager.closeAllWindow()
        break
      case "ipcMain/appInfo":
        await this.appInfo(payload)
        break
    }
  }

  async getAppInfo(){
    const appArgs = parseAppArgs()
    const electron_env = getElectronEnv()
    const appArgs_str = "```json\n" + JSON.stringify(appArgs, null, 2) + "```"
    const electron_env_str = "```json\n" + JSON.stringify(electron_env, null, 2) + "```"
    const text = `appArgs:\n${appArgs_str}\electronEnv\n${electron_env_str}`
    this.sendAction(text);
  }

  async debug(payload:any) {
    await this.getAppInfo()
  }
  async appInfo(payload:any) {
    await this.getAppInfo()
  }
  async openUserAppDataDir(eventData:any){
    let {userDataPath} = getElectronEnv()
    shell.openPath(userDataPath).catch((error) => {
      console.error(`Failed to open directory: ${error}`);
    });
  }

  async openJsDir(eventData:any){
    let {appPath} = getElectronEnv()
    if(isProd){
      appPath = path.join(appPath,".webpack","main","electron","js")
    }
    shell.openPath(appPath).catch((error) => {
      console.error(`Failed to open directory: ${error}`);
    });
  }
  async handlePosition(eventData:any){
    const displaySize = Ui.getDisplaySize(MainWindowManager.getInstance(this.botId).getMainWindow())
    const pyAutoGuiPosition = await new PyAutoGuiRpa().getPositionByPyAutoGui();
    console.log({
      eventData,
      displaySize,
      pyAutoGuiPosition
    })
  }
  async handleEvent(action:string,payload:any){
    switch (action) {
      case "ipcMainCallbackButton":
        this.ipcMainCallbackButton(payload || {}).catch((e) => {
          console.error("[ipcMainCallbackButton error]", e)
        })
        break
    }
  }
}
