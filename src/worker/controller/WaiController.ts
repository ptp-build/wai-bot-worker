import WaiOpenAPIRoute from '../services/WaiOpenAPIRoute';
import {Obj, Str} from '@cloudflare/itty-router-openapi';
import {RenderActions} from "../../types";
import ServerChatMsg from "../services/ServerChatMsg";
import ServerCallbackButton from "../services/ServerCallbackButton";
import ServerChatMsgCommand from "../services/ServerChatMsgCommand";
import ServerChatAiTask from "../services/ServerChatAiTask";
import ServerBotAccount from "../services/ServerBotAccount";

const requestBody = {
  payload: new Obj({}),
  action: new Str({
    required: true,
    description: ""
  }),
};

const responses = {
  '200': {
    schema: {},
  },
};
const schema = {
  tags: ['WaiApi'],
  requestBody,
  responses,
};

export class WaiAction extends WaiOpenAPIRoute {
  static schema = schema;
  async handle(request: Request, {body}: any) {
    await this.sessionStart(request);
    const {
      action,
      botId,
      payload
    } = body;
    const res = await this.handleAction(botId, action, payload);
    return WaiOpenAPIRoute.responseJson(res||{});
  }

  async handleAction(botId: string, action: RenderActions, payload: any) {
    console.log("[handleAction]",action, payload);
    const session = this.getSession()!;
    switch (action) {
      case RenderActions.InitWaiApp:
        return await ServerBotAccount.initWaiApp(session.getAccountAddress()!);
      case RenderActions.GetMsgInfo:
        return await new ServerChatAiTask(session).checkTask(payload);
      case RenderActions.ReportAiAskTask:
        return await new ServerChatAiTask(session).reportTask(payload);
      case RenderActions.GetAiAskTask:
        return await new ServerChatAiTask(session).fetchTask();
      case RenderActions.AnswerCallbackButton:
        return await new ServerCallbackButton(session, payload.data).process();
      case RenderActions.LoadBotCommands:
        return new ServerChatMsgCommand(session,payload.botId).LoadBotCommands();
      case RenderActions.EnableMultipleQuestion:
        return await new ServerChatMsgCommand(session, payload.chatId,payload.localMsgId).enableMultipleQuestion();
      case RenderActions.SendBotCommand:
        return await new ServerChatMsgCommand(session, payload.chatId,payload.localMsgId).processBotCommand(payload.command);
      case RenderActions.ApplyMsgId:
        return {
          msgId: await new ServerChatMsg(session,payload.chatId).genMsgId()
        };
      case RenderActions.SendMessage:
        return  await new ServerChatMsg(session,payload.chatId,payload.localMsgId).sendMessage(payload);
      case RenderActions.SendMultipleQuestion:
        return  await new ServerChatMsg(session,payload.chatId,payload.localMsgId).sendMultipleQuestion(payload);
    }
    return {};
  }
}
