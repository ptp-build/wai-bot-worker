import WaiOpenAPIRoute from '../share/cls/WaiOpenAPIRoute';
import {Str} from '@cloudflare/itty-router-openapi';
import {ENV} from "../env";
import {DoWebsocket} from "../share/service/do/DoWebsocket";
import BaseOpenAPIRoute from "../share/cls/BaseOpenAPIRoute";

const QueueBody = {
  text: new Str({
    required: true,
    example: 'hi',
    description: 'setting',
  }),
};

export class QueueAction extends BaseOpenAPIRoute {
  static schema = {
    tags: ['Queue'],
    requestBody: QueueBody,
    responses: {
      '200': {
        schema: {},
      },
    },
  };

  async handle(request: Request, data: Record<string, any>) {
    const { text} = data.body;
    await ENV.MSG_QUEUE.send({
      text,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers),
    });

    return WaiOpenAPIRoute.responseJson({
      accounts:new DoWebsocket().getAccounts()
    });
  }
}
