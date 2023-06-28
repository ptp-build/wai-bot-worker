import MsgConnectionManager from "./MsgConnectionManager";
import {Pdu} from "../../window/pdu/pdu";

let businessLogicProcessors = new Map<string, BusinessLogicProcessor>();

export default class BusinessLogicProcessor {
  private connId: string;
  private msgConnManager: MsgConnectionManager;
  constructor(connId: string) {
    this.connId = connId;
    this.msgConnManager = MsgConnectionManager.getInstance()
  }
  getAuthSession() {
    return this.msgConnManager.getMsgConn(this.connId)?.session
  }
  static getInstance(connId: string) {
    if(!businessLogicProcessors.has(connId)){
      businessLogicProcessors.set(connId,new BusinessLogicProcessor(connId))
    }
    return businessLogicProcessors.get(connId)!;
  }

  async handleWsMsg(pdu:Pdu) {
    switch (pdu.getCommandId()) {

    }
  }
}
