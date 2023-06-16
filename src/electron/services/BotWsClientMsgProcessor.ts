import { ActionCommands } from '../../lib/ptp/protobuf/ActionCommands';
import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';
import { ChatGptWaiChatBot } from './ai/ChatGptWaiChatBot';

let processors: Record<number, BotWsClientMsgProcessor> = {};

export default class BotWsClientMsgProcessor {
  private connId: number;
  private address?: string;

  constructor(connId: number) {
    this.connId = connId;
  }

  static getInstance(connId: number) {
    if (!processors[connId]) {
      processors[connId] = new BotWsClientMsgProcessor(connId);
    }
    return processors[connId];
  }

  async handleWsMsg(pdu: Pdu) {

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
    pdu.updateSeqNo(seqNum);
    this.ws.send(pdu.getPbData());
  }
}
