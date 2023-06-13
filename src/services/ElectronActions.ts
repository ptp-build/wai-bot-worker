import { getEnv, parseAppArgs } from '../utils/args';
import ElectronIpcMain from './ElectronIpcMain';
import { runCommand } from '../utils/evalSystemCmd';

export default class ElectronActions{
  private __id:number;
  private icpMainHandler: ElectronIpcMain;
  constructor(__id:number,icpMainHandler:ElectronIpcMain) {
    this.__id = __id;
    this.icpMainHandler = icpMainHandler
  }
  sendAction(text:string){
    this.icpMainHandler.sendAction({
      text,
      __id:this.__id
    })
  }

  async getAppInfo(){
    const appArgs = parseAppArgs()
    const env = getEnv()
    const appArgs_str = "```json\n" + JSON.stringify(appArgs, null, 2) + "```"
    const env_str = "```json\n" + JSON.stringify(env, null, 2) + "```"
    const text = `appArgs\n${appArgs_str}\nenv\n${env_str}`
    this.sendAction(text);
  }

  async createChatGptBotWorker(data: string) {
    const bufStr = data.split("/")[2]
    const buf = Buffer.from(bufStr,"hex").toString()
    const eventData = JSON.parse(buf)
    const {accountId,accountSign} = eventData
    const {electronPath,appPath} = getEnv()
    const {botWsServerPort} = parseAppArgs()
    const args = [
      appPath,
      "--homeUrl",
      "https://chat.openai.com",
      "--openDevTool",
      "false",
      "--appPosY",
      "0",
      "--appPosY",
      "0",
      "--appWidth",
      "300",
      "--appHeight",
      "600",
      "--partitionName",
      `bot_chatgpt_${accountId}`,
      "--accountId",
      accountId,
      "--accountSign",
      accountSign,
      "--msgServer",
      "ws://localhost:2235/ws",
      "--startBotWsClient",
      "true",
      "--isBotWsClientMaster",
      "true",
      "--startBotWsServer",
      "false"
    ]
    const res = await runCommand(electronPath,args)
    console.log("openChatGptBotWorkerApp",res)
  }
}
