import WaiOpenAPIRoute from '../services/WaiOpenAPIRoute';
import MsgConnectionApiHandler, {API_HOST_INNER} from "../services/MsgConnectionApiHandler";

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
    const res = await MsgConnectionApiHandler.getInstance()
      .fetch(new Request(`${API_HOST_INNER}/__accounts`))
    return {
      result:res
    }
  }
}
