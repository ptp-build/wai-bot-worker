import WaiOpenAPIRoute from '../share/cls/WaiOpenAPIRoute';
import { DoWebsocketApi } from '../share/service/do/DoWebsocketApi';


export class MasterAccountsAction extends WaiOpenAPIRoute {
  static schema = {
    tags: ['Master'],
    parameters: {

    },
    responses: {
      '200': {
        schema: {},
      },
    },
  };
  async handle(request: Request, data: Record<string, any>) {
    return {
      accounts:await new DoWebsocketApi().getAccounts()
    }
  }
}
