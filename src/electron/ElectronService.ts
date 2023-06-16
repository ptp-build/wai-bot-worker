import { AppArgvType } from './utils/args';
import { BotWsClient } from './services/BotWsClient';
import { sendToMainMsg, sendToRenderMsg } from './index';
import { startServers } from '../server/server';

let botWsClient:BotWsClient | undefined;

export default class ElectronService{
  private appArgs:AppArgvType;
  constructor(appArgs:AppArgvType) {
    this.appArgs = appArgs
  }
  async start(userDataPath:string){
    const {appArgs} = this
    if(appArgs.startWsServer){
      await startServers(appArgs.waiServerTcpPort, appArgs.waiServerWsPort,appArgs.waiServerHttpPort,userDataPath);
    }
    if(appArgs.startWsClient){
      botWsClient = await new BotWsClient().setMsgHandler({
        sendToRenderMsg,
        sendToMainMsg
      }).start(appArgs)
    }

    return this
  }
}
