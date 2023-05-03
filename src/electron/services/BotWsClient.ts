import BotWebSocket, { BotWebSocketNotifyAction, BotWebSocketState } from './BotWebSocket';
import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';
import { ActionCommands } from '../../lib/ptp/protobuf/ActionCommands';
import { MsgReq } from '../../lib/ptp/protobuf/PTPMsg';
import { ChatGpWorker } from './worker/chatGpt/ChatGpWorker';
import { MsgAction, UserAskChatGptMsg_Type } from '../../lib/ptp/protobuf/PTPCommon/types';


export class BotWsClient {
  private botWs?:BotWebSocket;
  async start(msgServer:string,accountId:number,accountSign:string) {

    if(!accountId || !accountSign || !msgServer){
      console.error("[BotWsClient start], error check the args!!!",JSON.stringify({msgServer,accountId,accountSign}))
      return
    }

    let botWs = BotWebSocket.getCurrentInstance();
    if(!botWs || botWs.getMsgConnId() !== accountId){
      if(botWs && botWs.isConnect()){
        await botWs.close()
        botWs.setAutoConnect(false)
        await botWs.waitForMsgServerState(BotWebSocketState.closed)
      }
      botWs = new BotWebSocket(accountId)
      botWs.setAutoConnect(true)
    }
    botWs.session = accountSign!
    botWs.setWsUrl(msgServer);
    botWs.clientInfo = { appVersion: 'Desktop', deviceModel: '', systemVersion: '' ,isBotWorker: true};
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
                await this.handleWsMsg(payload);
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

  async handleWsMsg(pdu: Pdu) {
    switch (pdu.getCommandId()) {
      case ActionCommands.CID_MsgReq:
        await this.handleMsgReq(pdu);
        break;
    }
  }

  async handleMsgReq(pdu: Pdu) {
    let { action,payload } = MsgReq.parseMsg(pdu);
    switch (action){
      case MsgAction.MsgAction_WaiChatGptUserAskMsg:
        const userAskChatGptMsg = JSON.parse(payload!) as UserAskChatGptMsg_Type
        console.debug("[MsgAction_WaiChatGptUserAskMsg]",userAskChatGptMsg)
        await ChatGpWorker.getInstance(userAskChatGptMsg.chatGptBotId)
          .getMsgProcessor().setPayload(userAskChatGptMsg).process();
        break
    }

  }

  close() {
    console.log("[BotWsClient close]",this.botWs)
    if(this.botWs){
      this.botWs.close().catch(console.error)
    }
  }
}
