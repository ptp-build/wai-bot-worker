import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';
import { ActionCommands, getActionCommandsName } from '../../lib/ptp/protobuf/ActionCommands';
import { Download, Upload } from '../share/service/File';
import {
  CallbackButtonReq,
  CallbackButtonRes,
  DownloadMsgReq,
  DownloadMsgRes,
  MsgListReq,
  MsgListRes,
  RemoveMessagesReq,
  RemoveMessagesRes,
  UploadMsgReq,
  UploadMsgRes,
} from '../../lib/ptp/protobuf/PTPMsg';
import { ERR, UserMessageStoreData_Type } from '../../lib/ptp/protobuf/PTPCommon/types';
import { ENV, kv, storage } from '../env';
import { AuthSessionType, User } from '../share/service/User';
import {
  CreateUserReq,
  CreateUserRes,
  DownloadUserReq,
  DownloadUserRes,
  FetchBotSettingReq,
  FetchBotSettingRes,
  GenUserIdReq,
  GenUserIdRes,
  SaveBotSettingReq,
  SaveBotSettingRes,
  ShareBotReq,
  ShareBotRes,
  ShareBotStopReq,
  ShareBotStopRes,
  UploadUserReq,
  UploadUserRes,
} from '../../lib/ptp/protobuf/PTPUser';
import WaiOpenAPIRoute from '../share/cls/WaiOpenAPIRoute';
import { PbMsg, PbUser, UserMessageStoreData } from '../../lib/ptp/protobuf/PTPCommon';
import { OtherNotify } from '../../lib/ptp/protobuf/PTPOther';
import { currentTs, currentTs1000 } from '../share/utils/utils';
import CallbackButtonHandler from '../share/service/CallbackButtonHandler';
import UserSetting from '../share/service/UserSetting';
import { MsgBot } from '../share/service/msg/MsgBot';
import { MsgBotPublic } from '../share/service/msg/MsgBotPublic';

export default class ProtoController extends WaiOpenAPIRoute {
  private authSession: AuthSessionType | undefined;
  static schema = {
    tags: ['Proto'],
    parameters: {},
    responses: {
      '200': {
        schema: {},
      },
    },
  };

  // @ts-ignore
  async handle(request: Request, data: Record<string, any>) {
    try {
      return await this.dispatch(request);
    } catch (e: any) {
      console.error(e.stack);
      return WaiOpenAPIRoute.responsePdu(
        new OtherNotify({
          err: ERR.ERR_SYSTEM,
        }).pack(),
        500
      );
    }
  }

  async dispatch(request: Request) {
    try {
      const arrayBuffer = await request.arrayBuffer();
      let pdu = new Pdu(Buffer.from(arrayBuffer));
      switch (pdu.getCommandId()) {
        case ActionCommands.CID_DownloadReq:
          return Download(pdu);
        default:
          break;
      }

      const res = await this.checkIfTokenIsInvalid(request);
      if (res) {
        return res;
      }

      const { authUserId, address } = this.authSession!;
      console.log('auth', authUserId, address);
      console.debug(
        '[Proto Req]',
        authUserId,
        address,
        pdu.getCommandId(),
        getActionCommandsName(pdu.getCommandId())
      );

      switch (pdu.getCommandId()) {
        case ActionCommands.CID_UploadUserReq:
          return this.handleUploadUserReq(Number(authUserId), pdu);
        case ActionCommands.CID_DownloadUserReq:
          return this.handleDownloadUserReq(Number(authUserId), pdu);
        case ActionCommands.CID_UploadMsgReq:
          return this.handleUploadMsgReq(Number(authUserId), pdu);
        case ActionCommands.CID_RemoveMessagesReq:
          return this.handleRemoveMessagesReq(authUserId, pdu);
        case ActionCommands.CID_DownloadMsgReq:
          return this.handleDownloadMsgReq(authUserId, pdu);
        case ActionCommands.CID_MsgListReq:
          return this.handleMsgListReq(authUserId, pdu);
        case ActionCommands.CID_ShareBotReq:
          return this.handleShareBotReq(Number(authUserId), pdu);
        case ActionCommands.CID_ShareBotStopReq:
          return this.handleShareBotStopReq(Number(authUserId), pdu);
        case ActionCommands.CID_SaveBotSettingReq:
          return this.handleSaveBotSettingReq(Number(authUserId), pdu);
        case ActionCommands.CID_CreateUserReq:
          return this.handleCreateUserReq(Number(authUserId), pdu);
        case ActionCommands.CID_FetchBotSettingReq:
          return this.handleFetchBotSettingReq(Number(authUserId), pdu);
        case ActionCommands.CID_GenUserIdReq:
          return this.handleGenUserIdReq(Number(authUserId), pdu);
        case ActionCommands.CID_CallbackButtonReq:
          return this.handleCallbackButtonReq(Number(authUserId), pdu);
        case ActionCommands.CID_UploadReq:
          return Upload(pdu);
        default:
          break;
      }
    } catch (e) {
      // @ts-ignore
      console.error(e.stack);
      // @ts-ignore
      return WaiOpenAPIRoute.responseError(ENV.IS_PROD ? 'System Error' : e.stack.split('\n'));
    }
  }

  async handleUploadMsgReq(authUserId: number, pdu: Pdu) {
    const { messages, chatId } = UploadMsgReq.parseMsg(pdu);
    const messageStorageDataStr = await kv.get(`W_M_S_D_${authUserId}_${chatId}`);

    let messageStorageData: UserMessageStoreData_Type = {
      time: currentTs1000(),
      chatId,
      messageIds: [],
      messageIdsDeleted: [],
    };

    if (messageStorageDataStr) {
      messageStorageData = UserMessageStoreData.parseMsg(
        new Pdu(Buffer.from(messageStorageDataStr, 'hex'))
      );
    }
    if (messages && messages?.length > 0) {
      for (let i = 0; i < messages?.length; i++) {
        const buf = messages[i];
        const msg = PbMsg.parseMsg(new Pdu(Buffer.from(buf)));
        if (messageStorageData.messageIds && !(messageStorageData.messageIds.indexOf(msg.id) > -1)) {
          messageStorageData.messageIds?.push(msg.id);
        }
        await storage.put(`wai/${authUserId}/messages/${chatId}/${msg.id}`, Buffer.from(buf!));
      }
      messageStorageData.time = currentTs1000();
      await kv.put(
        `W_M_S_D_${authUserId}_${chatId}`,
        Buffer.from(new UserMessageStoreData(messageStorageData).pack().getPbData()).toString('hex')
      );
    }
    return WaiOpenAPIRoute.responsePdu(
      new UploadMsgRes({
        userMessageStoreData: messageStorageData!,
        err: ERR.NO_ERROR,
      }).pack()
    );
  }
  async handleMsgListReq(authUserId: string, pdu: Pdu) {
    let { chatId, msgIds } = MsgListReq.parseMsg(pdu);
    const userInfo = await User.getUserInfoFromKv(chatId);
    const msgList:any[] = [];
    if (userInfo) {
      if (msgIds) {
        for (let i = 0; i < msgIds?.length; i++) {
          const msgId = msgIds[i];
          let msg = await MsgBot.getMsg(authUserId, chatId, msgId);
          msgList.push(msg);
        }
      }
    }
    console.log(msgList);
    return WaiOpenAPIRoute.responsePdu(
      new MsgListRes({
        chatId,
        msgList,
      }).pack()
    );
  }

  async handleDownloadMsgReq(authUserId: string, pdu: Pdu) {
    let { chatId, msgIds } = DownloadMsgReq.parseMsg(pdu);
    const msgIdsCache = await MsgBot.getMsgIds(authUserId, chatId);
    console.debug('[handleDownloadMsgReq]', { chatId, msgIds, msgIdsCache });

    let msgList:any[] = [];
    for (let i = 0; i < msgIdsCache.length; i++) {
      if (!msgIds || msgIds?.indexOf(msgIdsCache[i]) === -1) {
        msgList.push(await MsgBot.getMsg(this.authSession!.authUserId, chatId, msgIdsCache[i]));
      }
    }
    const isBotPublic = await User.getBotIsPublic(chatId);
    const ownerUserId = await User.getBotOwnerUserID(chatId);
    if (ownerUserId && ownerUserId !== authUserId && isBotPublic) {
      const pubMsgList = await MsgBotPublic.getMsgIds(chatId);
      if (pubMsgList.length > 0) {
        for (let i = 0; i < pubMsgList.length; i++) {
          if (
            !msgIds ||
            (msgIds?.indexOf(pubMsgList[i]) === -1 && msgIdsCache.indexOf(pubMsgList[i]) === -1)
          ) {
            msgList.push(await MsgBotPublic.getMsg(chatId, pubMsgList[i]));
          }
        }
      }
    }
    msgList = msgList.filter(id => !!id);
    console.log('[MsgBot]', msgList);
    return WaiOpenAPIRoute.responsePdu(
      new DownloadMsgRes({
        chatId,
        msgList,
      }).pack()
    );
  }

  async handleRemoveMessagesReq(authUserId:string, pdu: Pdu) {
    const { chatId, messageIds } = RemoveMessagesReq.parseMsg(pdu);
    let msgIds = await MsgBot.getMsgIds(this.authSession!.authUserId, chatId);
    if (messageIds && messageIds.length > 0) {
      const msgIdsNew = [];

      for (let i = 0; i < msgIds.length; i++) {
        const msgId = msgIds[i];
        if (messageIds.indexOf(msgId) === -1) {
          msgIdsNew.push(msgId);
          await MsgBot.deleteMsg(authUserId, chatId, msgId);
        }
      }
      if (msgIdsNew.length !== msgIds.length) {
        await MsgBot.saveMsgIds(this.authSession!.authUserId, chatId, msgIdsNew);
      }
    }
    return WaiOpenAPIRoute.responsePdu(
      new RemoveMessagesRes({
        err: ERR.NO_ERROR,
      }).pack()
    );
  }

  async handleUploadUserReq(authUserId: number, pdu: Pdu) {
    let { userBuf } = UploadUserReq.parseMsg(pdu);
    const buf = Buffer.from(userBuf);
    const user = PbUser.parseMsg(new Pdu(buf));
    if (!user.updatedAt) {
      user.updatedAt = currentTs();
    }
    if (user.id === '1') {
      user.id = this.getAuthSession()!.authUserId;
    }
    await storage.put(`wai/users/${user.id}`, Buffer.from(new PbUser(user).pack().getPbData()));
    await kv.put(`wai/users/updatedAt/${user.id}`, user.updatedAt.toString());

    console.debug(`saved userId:${user.id}`, user.updatedAt, JSON.stringify(user));

    return WaiOpenAPIRoute.responsePdu(
      new UploadUserRes({
        err: ERR.NO_ERROR,
      }).pack()
    );
  }

  async handleDownloadUserReq(authUserId: number, pdu: Pdu) {
    let { userId, updatedAt } = DownloadUserReq.parseMsg(pdu);
    if (userId === '1') {
      userId = this.getAuthSession()!.authUserId;
    }
    const updatedAtCache = await kv.get(`wai/users/updatedAt/${userId}`);

    console.log('handleDownloadUserReq', userId, updatedAt, updatedAtCache);
    if (updatedAtCache && updatedAt && updatedAt < Number(updatedAtCache)) {
      const res = await storage.get(`wai/users/${userId}`);
      if (res) {
        return WaiOpenAPIRoute.responsePdu(
          new DownloadUserRes({
            userBuf: Buffer.from(res),
            err: ERR.NO_ERROR,
          }).pack()
        );
      }
    }
    return WaiOpenAPIRoute.responsePdu(
      new DownloadUserRes({
        err: ERR.NO_ERROR,
      }).pack()
    );
  }

  async handleCreateUserReq(authUserId: number, pdu: Pdu) {
    let { username } = CreateUserReq.parseMsg(pdu);
    console.debug('[handleCreateUserReq]', username);
    await kv.put('W_U_USERNAME_' + username, authUserId.toString());
    return WaiOpenAPIRoute.responsePdu(new CreateUserRes({}).pack());
  }
  async handleFetchBotSettingReq(authUserId: number, pdu: Pdu) {
    let { key } = FetchBotSettingReq.parseMsg(pdu);
    console.debug('[handleFetchBotSettingReq]', key);
    const value = await new UserSetting(this.getAuthSession()!.authUserId).getValue(key);
    return WaiOpenAPIRoute.responsePdu(
      new FetchBotSettingRes({
        key,
        value,
      }).pack()
    );
  }

  async handleSaveBotSettingReq(authUserId: number, pdu: Pdu) {
    let { key, value } = SaveBotSettingReq.parseMsg(pdu);
    console.debug('[handleSaveBotSettingReq]', key, value);
    await new UserSetting(this.getAuthSession()!.authUserId).setValue(key, value);
    return WaiOpenAPIRoute.responsePdu(new SaveBotSettingRes({}).pack());
  }

  async handleShareBotReq(authUserId: number, pdu: Pdu) {
    let { catBot, catTitle } = ShareBotReq.parseMsg(pdu);
    catTitle = catTitle.trim();
    const str = await kv.get('topCats-cn.json');
    const chatId = catBot.userId;
    const topCats = str ? JSON.parse(str) : require('../assets/jsons/topCats-cn.json');

    let isCatExists = false;

    for (let i = 0; i < topCats.cats.length; i++) {
      const tapCat = topCats.cats[i];
      const botIds = [...new Set(tapCat.botIds)];

      if (tapCat.title === catTitle) {
        isCatExists = true;
        if (botIds.indexOf(chatId) === -1) {
          topCats.cats[i].botIds.push(chatId);
        }
      } else {
        if (botIds.indexOf(chatId) > -1) {
          topCats.cats[i].botIds = topCats.cats[i].botIds.filter((id:string) => chatId !== id);
        }
      }
    }
    if (!isCatExists) {
      topCats.cats.push({
        title: catTitle,
        botIds: [chatId],
      });
    }
    topCats.bots.forEach((bot:any) => {
      bot.time = currentTs1000();
    });
    let bot = topCats.bots.find((bot:any) => bot.userId === chatId);
    if (!bot) {
      topCats.bots.push({
        ...catBot,
        time: currentTs1000(),
      });
    } else {
      for (let i = 0; i < topCats.bots.length; i++) {
        const bot = topCats.bots[i];
        if (bot.userId === chatId) {
          topCats.bots[i] = {
            ...bot,
            ...catBot,
            time: currentTs1000(),
          };
          break;
        }
      }
    }

    topCats.time = currentTs1000();
    await kv.put('topCats-cn.json', JSON.stringify(topCats));
    await kv.put('topCats-bots-cn.json', JSON.stringify(topCats.bots));

    return WaiOpenAPIRoute.responsePdu(
      new ShareBotRes({
        err: ERR.NO_ERROR,
      }).pack()
    );
  }
  async handleShareBotStopReq(authUserId: number, pdu: Pdu) {
    let { userId } = ShareBotStopReq.parseMsg(pdu);
    const str = await kv.get('topCats-cn.json');
    const topCats = JSON.parse(str);
    let changed = false;
    for (let i = 0; i < topCats.cats.length; i++) {
      const cat = topCats.cats[i];
      if (cat.botIds.indexOf(userId) > -1) {
        changed = true;
        topCats.cats[i].botIds = topCats.cats[i].botIds.filter((id:string) => id !== userId);
      }
    }
    if (changed) {
      topCats.time = currentTs1000();
      await kv.put('topCats-cn.json', JSON.stringify(topCats));
    }
    return WaiOpenAPIRoute.responsePdu(
      new ShareBotStopRes({
        err: ERR.NO_ERROR,
      }).pack()
    );
  }
  async handleCallbackButtonReq(authUserId: number, pdu: Pdu) {
    console.debug(
      '[handleCallbackButtonReq]',
      authUserId,
      this.getAuthSession(),
      await this.getUserTotalSpend(),
      await this.getUserTotalSpend()
    );
    let { chatId, data } = CallbackButtonReq.parseMsg(pdu);
    const { text, inlineButtons } = await new CallbackButtonHandler({
      authSession: this.authSession!,
      chatId: chatId,
    }).process(data);
    return WaiOpenAPIRoute.responsePdu(
      new CallbackButtonRes({
        chatId,
        text:text!,
        inlineButtons,
      }).pack()
    );
  }
  async handleGenUserIdReq(authUserId: number, pdu: Pdu) {
    console.debug('[handleGenUserIdReq]', authUserId);
    const { username } = GenUserIdReq.parseMsg(pdu);
    if (username) {
      if (await kv.get('W_U_USERNAME_' + username)) {
        return WaiOpenAPIRoute.responsePdu(
          new GenUserIdRes({
            err: ERR.ERR_SYSTEM,
          }).pack()
        );
      }
    }
    const userIdStr = await kv.get('USER_INCR', true);
    let userId = parseInt(ENV.SERVER_USER_ID_START);
    if (userIdStr) {
      userId = parseInt(userIdStr) + 1;
      if (userId < parseInt(ENV.SERVER_USER_ID_START)) {
        userId = parseInt(ENV.SERVER_USER_ID_START) + 1;
      }
    } else {
      userId += 1;
    }
    await kv.put('USER_INCR', userId.toString());
    await kv.put(`W_B_U_R_${userId}`, authUserId.toString());
    return WaiOpenAPIRoute.responsePdu(
      new GenUserIdRes({
        userId,
        err: ERR.NO_ERROR,
      }).pack()
    );
  }
}
