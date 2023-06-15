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
    let {accountId,accountSign,accountNum} = eventData
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

    const args = [
      appPath,
      "--homeUrl",
      "https://chat.openai.com",
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
      accountId,accountSign,appWidth,appHeight,appPosX,appPosY
    });
    const res = await runCommand(electronPath,args)
    console.log("openChatGptBotWorkerApp",res)
  }
}
