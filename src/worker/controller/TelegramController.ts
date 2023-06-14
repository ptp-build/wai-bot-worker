import WaiOpenAPIRoute from '../share/cls/WaiOpenAPIRoute';
import {Str} from '@cloudflare/itty-router-openapi';
import {sendTextMessageToTelegram, TelegramBot,} from '../share/service/third_party/Telegram';

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

export class TelegramBotSendMessageAction extends WaiOpenAPIRoute {
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

    const res = await sendTextMessageToTelegram(text, chatId, token);
    console.log(res);
    await this.notifyUrlButton(text, chatId, token);
    return WaiOpenAPIRoute.responseJson(res);
  }
  async notifyUrlButton(text: string, chatId: string, token: string) {
    await new TelegramBot(token).sendPayMsg(
      text,
      [
        [
          {
            text: 'Visit Website',
            url: 'https://www.example.com',
          },
        ],
      ],
    );
  }
}
