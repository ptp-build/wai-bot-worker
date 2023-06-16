import {  parseAppArgs } from '../utils/args';
import ElectronIpcMain from './ElectronIpcMain';
import { runCommand } from '../utils/evalSystemCmd';
import { getElectronEnv } from '../utils/electronEnv';
import Ui, { getAppPosition } from '../ui/Ui';
import { ChatGptWaiChatBot } from './ai/ChatGptWaiChatBot';

export default class ElectronActions{
  private __id:number;
  private icpMainHandler: ElectronIpcMain;
  constructor(__id:number,icpMainHandler:ElectronIpcMain) {
    this.__id = __id;
    this.icpMainHandler = icpMainHandler
  }
  sendAction(text:string,payload?:any){
    this.icpMainHandler.sendAction({
      text,
      payload,
      __id:this.__id
    })
  }

  async getAppInfo(){
    const appArgs = parseAppArgs()
    const electron_env = getElectronEnv()
    const appArgs_str = "```json\n" + JSON.stringify(appArgs, null, 2) + "```"
    const electron_env_str = "```json\n" + JSON.stringify(electron_env, null, 2) + "```"
    const text = `appArgs:\n${appArgs_str}\electronEnv\n${electron_env_str}`
    this.sendAction(text);
  }

  async createChatGptBotWorker(data: string) {
    const bufStr = data.split("/")[2]
    const buf = Buffer.from(bufStr,"hex").toString()
    const eventData = JSON.parse(buf)
    let {accountId,accountSign,accountNum,proxy,chatGptAuthUser} = eventData
    accountId = Number(accountId)
    accountNum = accountNum || 0
    const {electronPath,appPath} = getElectronEnv()
    const {appSubWidth,appSubHeight,windowGap} = parseAppArgs()
    const {displayHeight,displayWidth} = Ui.getDisplaySizeFromCache()
    const appWidth = eventData.appWidth || appSubWidth
    const appHeight = eventData.appHeight || appSubHeight
    let appPosY;
    let appPosX;
    if(!eventData.botId){
      const resPost = getAppPosition(accountNum,displayWidth,displayHeight,appWidth,appHeight,windowGap)
      if(!resPost){
        this.sendAction("窗口数量过多");
        return
      }
      appPosX = resPost.appPosX
      appPosY = resPost.appPosY
    }else{
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

    const args = [
      appPath,
      "--homeUrl",
      "https://chat.openai.com",
      "--chatGptUsername",
      chatGptUsername,
      "--chatGptPassword",
      chatGptPassword,
      "--useProxy",
      useProxy,
      "--proxyType",
      proxyType,
      "--proxyIp",
      proxyIp,
      "--proxyPort",
      proxyPort,
      "--proxyUsername",
      proxyUsername,
      "--proxyPassword",
      proxyPassword,
      "--openDevTool",
      "false",
      "--appPosX",
      appPosX,
      "--appPosY",
      appPosY,
      "--appWidth",
      appWidth,
      "--appHeight",
      appHeight,
      "--partitionName",
      `bot_chatgpt_${accountId}`,
      "--accountId",
      accountId,
      "--accountSign",
      accountSign,
      "--startWsServer",
      "false",
      "--startWsClient",
      "true",
      "--isWsClientMaster",
      "true"
    ]
    this.sendAction("创建成功",{
      type:"chatGpt",
      botId:eventData.botId,
      proxy,chatGptAuthUser,
      accountId,accountSign,appWidth,appHeight,appPosX,appPosY
    });
    try {
      const res = await runCommand(electronPath,args)
    }catch (e){
      console.warn("[createChatGptBotWorker][runCommand error]")
    }

  }
}
