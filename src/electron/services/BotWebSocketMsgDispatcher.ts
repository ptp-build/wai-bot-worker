import { ActionCommands } from '../../lib/ptp/protobuf/ActionCommands';
import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';
import { SendBotMsgReq } from '../../lib/ptp/protobuf/PTPMsg';
import { ChatGptWaiChatBot } from './ai/ChatGptWaiChatBot';

let dispatchers: Record<number, BotWebSocketMsgDispatcher> = {};

export default class BotWebSocketMsgDispatcher {
  private accountId: number;
  private address?: string;
  constructor(accountId: number) {
    this.accountId = accountId;
  }

  static getInstance(accountId: number) {
    if (!dispatchers[accountId]) {
      dispatchers[accountId] = new BotWebSocketMsgDispatcher(accountId);
    }
    return dispatchers[accountId];
  }

  async handleWsMsg(accountId: number, pdu: Pdu) {
    // console.log(
    //   '[onMessage]',
    //   getActionCommandsName(pdu.getCommandId()),
    //   pdu.getSeqNum()
    //   // pdu.getPbData().slice(0, 16)
    // );
    switch (pdu.getCommandId()) {
      case ActionCommands.CID_SendBotMsgReq:
        await this.handleSendBotMsgReq(pdu);
        break;
    }
  }

  async handleSendBotMsgReq(pdu: Pdu) {
    await new ChatGptWaiChatBot(pdu).process();
  }

  private ws: WebSocket | any;
  setWs(ws: WebSocket | any) {
    this.ws = ws;
  }

  setAddress(address: string) {
    this.address = address;
  }
  sendPdu(pdu: Pdu, seqNum: number = 0) {
    // console.log('sendPdu', getActionCommandsName(pdu.getCommandId()));
    pdu.updateSeqNo(seqNum);
    this.ws.send(pdu.getPbData());
  }
}
