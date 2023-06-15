import Account from '../../worker/share/Account';
import LocalStorage from '../../worker/share/db/LocalStorage';
// import { getAppVersion } from '../../worker/msg/WaiBridge';

import WaiBotRpa from './WaiBotRpa';
import BotWebSocket, { BotWebSocketNotifyAction, BotWebSocketState } from './BotWebSocket';

let loading = false

export default class WaiBotMaster{
  private sign: string;
  private waiBotRpa: WaiBotRpa;
  constructor(sign:string) {
    this.sign = sign
    this.waiBotRpa = new WaiBotRpa()
  }
  addChatGptMsgHanlder(){
    //@ts-ignore
    // window.on_chatgpt_recv_msg = async payload => {
    //   const { text, index, state } = JSON.parse(decodeFromBase64(payload)!);
    //   ChatGptWaiChatBot.getCurrentObj()?.handleWebChatGptMsg({ text, index, state });
    // };
    return this
  }
  async initWaiBotRpa(){
    // await this.waiBotRpa.startServer();
    await this.initWebSocket();
    return this
  }
  async initWebSocket(){
    const {sign} =this
    if (loading || !sign || !Account.verifySignFromQrcode(sign)) {
      loading = false;
      return;
    }
    loading = true;
    try {
      Account.setClientKv(new LocalStorage());
      const accountId = Account.getCurrentAccountId()!;
      console.log('[Account init]', accountId, loading);
      // const appVersion = getAppVersion();

      Account.getCurrentAccount()?.setSession(Account.getSignFromQrcode(sign)).setClientInfo({
        appVersion:"",
        deviceModel: '',
        systemVersion: '',
      });

      const botWs = BotWebSocket.getInstance(accountId);

      if (!botWs.isLogged()) {
        botWs.setMsgHandler(async (msgConnId, notifies) => {
          for (let i = 0; i < notifies.length; i++) {
            const { action, payload } = notifies[i];
            switch (action) {
              case BotWebSocketNotifyAction.onConnectionStateChanged:
                switch (payload.BotWebSocketState) {
                  case BotWebSocketState.logged:
                    console.log('BotWebSocketState.logged');
                    break;
                  case BotWebSocketState.connected:
                    break;
                  case BotWebSocketState.closed:
                    break;
                }
                break;
              case BotWebSocketNotifyAction.onData:
                // console.log("[onData]",{accountId},getActionCommandsName(payload.getCommandId()))
                if (payload.getCommandId() === 5001) {
                  return;
                }
                // await new MsgDispatcher(accountId).handleSendBotMsgReq(payload);
                break;
            }
          }
        });
        // botWs.setWsUrl(MSG_SERVER);
        if (!botWs.isConnect()) {
          botWs.connect();
        }
        if (botWs.isConnect() && !botWs.isLogged()) {
          await botWs.login();
        }
        await botWs.waitForMsgServerState(BotWebSocketState.logged);
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
    return this
  }

}
