import MsgConnectionManager from './MsgConnectionManager';
import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';
import { ActionCommands } from '../../lib/ptp/protobuf/ActionCommands';
import { SyncReq, SyncRes, TopCatsRes } from '../../lib/ptp/protobuf/PTPSync';
import { AuthSessionType, getSessionInfoFromSign, User } from '../share/service/User';
import { AuthLoginReq, AuthLoginRes } from '../../lib/ptp/protobuf/PTPAuth';
import { ChatGptStreamStatus, ERR, MsgAction, UserStoreData_Type } from '../../lib/ptp/protobuf/PTPCommon/types';
import { kv, storage } from '../env';
import { PbMsg, PbUser, UserStoreData } from '../../lib/ptp/protobuf/PTPCommon';
import { MsgReq, SendBotMsgReq, SendBotMsgRes, SendMsgRes, SendTextMsgReq } from '../../lib/ptp/protobuf/PTPMsg';
import MsgConnChatGptBotWorkerManager, { MsgConnChatGptBotWorkerStatus } from './MsgConnChatGptBotWorkerManager';
import { DoWebsocketApi } from '../share/service/do/DoWebsocketApi';
import UserSetting from '../share/service/UserSetting';
import { TelegramBot } from '../share/service/third_party/Telegram';
import { MsgBot } from '../share/service/msg/MsgBot';
import { currentTs } from '../share/utils/utils';
import MsgConnectionApiHandler from './MsgConnectionApiHandler';
import { ChatGptWorker } from '../share/service/ai/ChatGptWorker';

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
  sendPdu(pdu: Pdu, seqNum: number = 0) {
    pdu.updateSeqNo(seqNum);
    this.msgConnManager.sendBuffer(this.connId,Buffer.from(pdu.getPbData()));
  }
  async handleWsMsg(pdu:Pdu) {
    switch (pdu.getCommandId()) {
      case ActionCommands.CID_SyncReq:
        await this.handleSyncReq(pdu);
        break;
      case ActionCommands.CID_TopCatsReq:
        await this.handleTopCatsReq(pdu);
        break;
      case ActionCommands.CID_SendBotMsgReq:
        await this.handleSendBotMsgReq(pdu);
        break;
      case ActionCommands.CID_SendTextMsgReq:
        await this.handleSendTextMsgReq(pdu);
        break
      case ActionCommands.CID_MsgReq:
        await this.handleMsgReq(pdu);
        break;
    }
  }

  async handleAuthLoginReq(pdu: Pdu): Promise<AuthSessionType | undefined> {
    const { sign, clientInfo } = AuthLoginReq.parseMsg(pdu);
    const res = await getSessionInfoFromSign(sign);
    if (res) {
      this.sendPdu(
        new AuthLoginRes({
          err: ERR.NO_ERROR,
        }).pack(),
        pdu.getSeqNum()
      );
    }

    return res;
  }
  async handleSyncReq(pdu: Pdu) {
    let { userStoreData } = SyncReq.parseMsg(pdu);
    const {authUserId} = this.getAuthSession()!;
    const userStoreDataStr = await kv.get(`W_U_S_D_${authUserId}`);
    let userStoreDataRes: UserStoreData_Type;
    if (userStoreDataStr) {
      const buf = Buffer.from(userStoreDataStr, 'hex');
      userStoreDataRes = UserStoreData.parseMsg(new Pdu(buf));
      // console.debug('userStoreDataRes', this.address, JSON.stringify(userStoreDataRes));
      if (!userStoreData) {
        this.sendPdu(new SyncRes({ userStoreData: userStoreDataRes }).pack());
        return;
      }
    }
    if (userStoreData) {
      await kv.put(
        `W_U_S_D_${authUserId}`,
        Buffer.from(new UserStoreData(userStoreData).pack().getPbData()).toString('hex')
      );
    }
  }

  async handleMsgReq(pdu: Pdu) {
    let {action,payload} = MsgReq.parseMsg(pdu)
    switch (action){
      case MsgAction.MsgAction_WaiChatGptPromptsInputReady:
        MsgConnChatGptBotWorkerManager.getInstance().setStatus(this.connId,MsgConnChatGptBotWorkerStatus.READY)
        break
    }
  }
  async handleSendTextMsgReq(pdu: Pdu) {
    let req = SendTextMsgReq.parseMsg(pdu);
    const {authUserId} = this.getAuthSession()!;
    const msg = PbMsg.parseMsg(new Pdu(Buffer.from(req.msg!)));
    if(msg.senderId === "1"){
      msg.senderId = authUserId
    }
    console.debug('handleSendTextMsgReq',msg);
    const text = msg.content.text?.text
    const chatId = msg.chatId
    const msgId = msg.id
    const replyToUserId = msg.replyToUserId
    const res = await storage.get(`wai/users/${chatId}`);
    if (res) {
      const chatOwnerUserId = await User.getBotOwnerUserID(chatId);
      if (chatOwnerUserId !== authUserId) {
        const user = PbUser.parseMsg(new Pdu(Buffer.from(res)));
        const tg = await new UserSetting(chatOwnerUserId).getValue(chatId + '/link/tg');
        console.log(authUserId, chatOwnerUserId, tg);
        // const dd = await new UserSetting(chatOwnerUserId).getValue(chatId + '/link/dd');

        if (tg && tg.split('@').length === 2) {
          const [tgToken, tgChatId] = tg.split('@');
          let url = 'https://wai.chat/#' + chatId;
          const resDo = await new DoWebsocketApi().sendMsg({
            toUserId: chatOwnerUserId,
            fromUserId: authUserId!,
            text:text!,
            chatId,
          })
          // @ts-ignore
          if (resDo.status === 404) {
            new TelegramBot(tgToken).replyUrlButton(text!,`${user.firstName}`,url,tgChatId).catch(console.error);
          }
        }
      } else {
        if(replyToUserId){
          await new DoWebsocketApi().sendMsg({
            toUserId: replyToUserId,
            fromUserId: chatId,
            text:text!,
            chatId,
          })
        }
        await new MsgBot(authUserId!,chatId,msg).saveMsg()
      }
    }

    this.sendPdu(
      new SendMsgRes({
        chatId,
        msgId,
        senderId: chatId,
        date: currentTs(),
        replyText: '',
      }).pack(),
      pdu.getSeqNum()
    );
  }
  async handleSendBotMsgReq(pdu: Pdu) {
    const {authUserId} = this.getAuthSession()!;
    let { text, chatId,streamStatus, msgDate,msgAskId,msgAskDate, toUid,msgId, chatGpt } = SendBotMsgReq.parseMsg(pdu);
    // console.log('handleSendBotMsgReq', { text, chatId, msgId, chatGpt,senderId:this.authUserId,toUid });
    if (chatGpt) {
      const manager = MsgConnChatGptBotWorkerManager.getInstance();
      const msgConnId = manager.getRandomReadyWorker()
      let reply = "..."
      if(msgConnId){
        manager.setStatus(msgConnId,MsgConnChatGptBotWorkerStatus.BUSY)
        await new ChatGptWorker().process(pdu,authUserId,msgConnId);
      }else{
        reply = "Work is busy! pls Retry later"
      }
      this.sendPdu(new SendBotMsgRes({
        reply,
        chatId,
        msgId,
        msgDate,
      }).pack(),pdu.getSeqNum())
    }
    if(toUid){
      kv.put(`${toUid}_${chatId}_${msgId}_${text!.split("_")[0]}`,text).catch(console.error)
      console.log("[toUser]",text)
      this.sendPdu(new SendBotMsgRes({
        reply:"",
        chatId,
        msgId,
        msgDate,
      }).pack(),pdu.getSeqNum())

      await MsgConnectionApiHandler.getInstance().sendBotMsgRes(toUid,
        Buffer.from(
          new SendBotMsgRes({
            reply: text,
            chatId,
            msgId,
            msgDate,
            streamStatus
          }).pack().getPbData()),
      )
      if(streamStatus === ChatGptStreamStatus.ChatGptStreamStatus_DONE){
        MsgConnChatGptBotWorkerManager.getInstance().setStatus(this.connId,MsgConnChatGptBotWorkerStatus.READY)
      }
    }
  }

  async handleTopCatsReq(pdu: Pdu) {
    this.sendPdu(
      new TopCatsRes({
      }).pack(),
      pdu.getSeqNum()
    );
  }
}
