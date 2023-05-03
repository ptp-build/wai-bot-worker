
import {OpenAPIRoute} from '@cloudflare/itty-router-openapi';
import { getCorsHeader } from '../share/utils/utils';
import { ENV } from '../env';

//@ts-ignore
export default class BaseOpenAPIRoute extends OpenAPIRoute {
  jsonResp(params: { data: Record<string, any>; status?: number }): Response {
    return new Response(JSON.stringify(params.data), {
      headers: {
        ...getCorsHeader(ENV.Access_Control_Allow_Origin),
      },
      status: params.status || 200,
    });
  }

  static responseError(error = '', status = 500) {
    return BaseOpenAPIRoute.responseJson({ error, status }, status);
  }

  static responseData(data: any, status = 200) {
    return new Response(data, {
      status,
      headers: {
        ...getCorsHeader(ENV.Access_Control_Allow_Origin),
      },
    });
  }

  static responseJsonData(data: object, tips?: string, status = 200) {
    return new Response((tips || '') + '```json\n' + JSON.stringify(data, null, 2) + '```', {
      status,
      headers: {
        ...getCorsHeader(ENV.Access_Control_Allow_Origin),
      },
    });
  }
  static responseJson(data: object, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        ...getCorsHeader(ENV.Access_Control_Allow_Origin),
      },
    });
  }
  static responseBuffer(data: Buffer, status = 200) {
    return new Response(data, {
      status,
      headers: {
        ...getCorsHeader(ENV.Access_Control_Allow_Origin, 'application/octet-stream'),
      },
    });
  }
}
