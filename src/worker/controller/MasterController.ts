import WaiOpenAPIRoute from '../services/WaiOpenAPIRoute';
import { DoWebsocketApi } from '../services/do/DoWebsocketApi';


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
    const res = await new DoWebsocketApi().getAccounts()
    return {
      result:res
    }
  }
}
