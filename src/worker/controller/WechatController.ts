import {Str} from '@cloudflare/itty-router-openapi';
import WaiOpenAPIRoute from '../services/WaiOpenAPIRoute';
import { WechatMessage } from '../services/third_party/WechatMessage';

const BotSendMessageBody = {
  token: new Str({
    example: '',
    description: 'token',
  }),
  chatId: new Str({
    example: '',
    description: 'chatId',
  }),
  text: new Str({
    required: true,
    example: 'hi',
    description: 'setting',
  }),
};

export class WechatBotSendMessageAction extends WaiOpenAPIRoute {
  static schema = {
    tags: ['Notification'],
    requestBody: BotSendMessageBody,
    responses: {
      '200': {
        schema: {},
      },
    },
  };

  async handle(request: Request, data: Record<string, any>) {
    const { text, chatId, token } = data.body;
    const res = await new WechatMessage().sendNotify(text);
    return WaiOpenAPIRoute.responseJson(res);
  }
}
