import { AppArgvType } from '../utils/args';
import BotWebSocket, { BotWebSocketNotifyAction, BotWebSocketState } from './BotWebSocket';
import BotWebSocketMsgDispatcher from './BotWebSocketMsgDispatcher';


export class BotWsClient {
  private appArgs?: AppArgvType;
  private botWs?:BotWebSocket;

  private msgHandler?: { sendToRenderMsg: (action: string, payload?: any) => void; sendToMainMsg: (action: string, payload?: any) => void };
  setMsgHandler(msgHandler:{
    sendToRenderMsg:(action:string,payload?:any)=>void,
    sendToMainMsg:(action:string,payload?:any)=>void
  }){
    this.msgHandler = msgHandler
    return this
  }

  async start(appArgs:AppArgvType) {
    this.appArgs = appArgs;
    const {msgServer,accountId,accountSign} = this.appArgs
    if(!accountId || !accountSign || !msgServer){
      console.error("[BotWsClient start], error check the args!!!",JSON.stringify({msgServer,accountId,accountSign}))
      return
    }
    this.msgHandler!.sendToRenderMsg("onStartBotWsClient",{accountId})

    const botWs = BotWebSocket.getInstance(Number(accountId));
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
                if (payload.getCommandId() === 5001) {
                  return;
                }
                await new BotWebSocketMsgDispatcher(accountId).handleWsMsg(accountId,payload);
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
    const {startWsClient} = this.appArgs!
    if(startWsClient && this.botWs){
      this.botWs.close().catch(console.error)
    }
  }
}
