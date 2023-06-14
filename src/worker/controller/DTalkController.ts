import WaiOpenAPIRoute from '../share/cls/WaiOpenAPIRoute';
import {Str} from '@cloudflare/itty-router-openapi';
import {DTalk} from "../share/service/third_party/DTalk";

const BotSendMessageBody = {
  text: new Str({
    required: true,
    example: 'hi',
    description: 'setting',
  }),
};

export class DTalkBotSendMessageAction extends WaiOpenAPIRoute {
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
    const { text} = data.body;
    const res = await new DTalk().sendMessage(text);
    return WaiOpenAPIRoute.responseJson(res);
  }
}
