import { AppArgvType } from '../utils/args';
import BotWebSocket, { BotWebSocketNotifyAction, BotWebSocketState } from './BotWebSocket';


export class BotWsClient {
  private appArgs: AppArgvType;
  private botWs:BotWebSocket;

  private msgHandler: { sendToRenderMsg: (action: string, payload?: any) => void; sendToMainMsg: (action: string, payload?: any) => void };
  setMsgHandler(msgHandler:{
    sendToRenderMsg:(action:string,payload?:any)=>void,
    sendToMainMsg:(action:string,payload?:any)=>void
  }){
    this.msgHandler = msgHandler
    return this
  }

  async start(appArgs:AppArgvType) {
    this.appArgs = appArgs;
    const {botWsServerPort,msgServer,accountId,accountSign,startBotWsClient} = this.appArgs
    if(!startBotWsClient){
      return
    }
    if(!botWsServerPort || !accountId || !accountSign || !msgServer){
      console.error("[BotWsClient start], error check the args!!!",JSON.stringify({botWsServerPort,msgServer,accountId,accountSign}))
      return
    }
    this.msgHandler.sendToRenderMsg("onStartBotWsClient",{accountId,botWsServerPort})

    const botWs = BotWebSocket.getInstance(accountId);
    botWs.session = accountSign!
    botWs.setWsUrl(msgServer);
    botWs.clientInfo = { appVersion: 'Desktop', deviceModel: '', systemVersion: '' };
    if (!botWs.isLogged()) {
        botWs.setMsgHandler(async (accountId, notifies) => {
          for (let i = 0; i < notifies.length; i++) {
            const { action, payload } = notifies[i];
            switch (action) {
              case BotWebSocketNotifyAction.onConnectionStateChanged:
                switch (payload.BotWebSocketState) {
                  case BotWebSocketState.logged:
                    console.log('[BotWsClient] logged');
                    break;
                  case BotWebSocketState.connected:
                    break;
                  case BotWebSocketState.closed:
                    break;
                }
                break;
              case BotWebSocketNotifyAction.onData:
                console.log('[BotWsClient] onData');
                if (payload.getCommandId() === 5001) {
                  return;
                }
                // await new MsgDispatcher(msgConnId).handleSendBotMsgReq(payload);
                break;
            }

          }
        })
        try {
          if (!botWs.isConnect()) {
            botWs.connect();
          }
          if (botWs.isConnect() && !botWs.isLogged()) {
            await botWs.login();
          }
          await botWs.waitForMsgServerState(BotWebSocketState.logged);
          this.botWs = botWs
        }catch (e){
          console.error("[BotWsClient]",e)
        }

    }

    return this
  }
  close() {
    console.log("[BotWsClient close]",this.botWs)
    const {startBotWsClient} = this.appArgs
    if(startBotWsClient && this.botWs){
      this.botWs.close().catch(console.error)
    }
  }
}
