import WaiOpenAPIRoute from '../share/cls/WaiOpenAPIRoute';
import {Str} from '@cloudflare/itty-router-openapi';

const CronBody = {
  text: new Str({
    required: true,
    example: 'hi',
    description: 'setting',
  }),
};

export class CronAction extends WaiOpenAPIRoute {
  static schema = {
    tags: ['Cron'],
    requestBody: CronBody,
    responses: {
      '200': {
        schema: {},
      },
    },
  };

  async handle(request: Request, data: Record<string, any>) {
    const { text} = data.body;

    return WaiOpenAPIRoute.responseJson({

    });
  }
}