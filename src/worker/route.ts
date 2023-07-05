import {ENV, Environment, ExecutionContext, initEnv, setGlobalCtx} from './env';
import {OpenAPIRouter, OpenAPIRouterSchema, OpenAPIRouteSchema} from '@cloudflare/itty-router-openapi';
import KvCache from "./services/kv/KvCache";
import WaiOpenAPIRoute from "./services/WaiOpenAPIRoute";
import { currentTs1000 } from '../sdk/common/time';
import { getCorsOptionsHeader } from '../sdk/common/http';
import { SWAGGER_DOC } from '../sdk/common/swagger';

export class WaiRouter {
  private version?: string;
  private title: string;
  private router: any;
  constructor(info: { title: string; version?: string }) {
    this.title = info.title;
    this.version = info.version;
  }
  getInfo() {
    return {
      title: this.title,
      version: this.version || '1.0.1',
    };
  }
  setRoute(iRoute: (router: OpenAPIRouterSchema) => void) {
    const router = OpenAPIRouter({
      ...SWAGGER_DOC,
      schema: {
        ...SWAGGER_DOC.schema,
        info: {
          ...this.getInfo(),
        },
      },
    });
    this.router = router;
    const preRouteHandler = async (request: Request) => {
      if (request.method === 'OPTIONS') {
        return new Response('', {
          headers: {
            ...getCorsOptionsHeader(ENV.Access_Control_Allow_Origin),
          },
        });
      }
    }
    //@ts-ignore
    router.all('*', preRouteHandler as OpenAPIRouteSchema);

    iRoute(router);
    router.original.get('/', (request:Request) => Response.redirect(`${request.url}docs`, 302));
    const allHandler = () => new Response('Not Found.', { status: 404 })
    //@ts-ignore
    router.all('*', allHandler as OpenAPIRouteSchema);
    return this;
  }

  setEnv(env: Environment) {
    initEnv(env);
    return this;
  }

  setCtx(ctx: ExecutionContext) {
    setGlobalCtx(ctx);
    return this;
  }
  async handleRequest(request: Request) {
    const url = request.url;
    const urlObj = new URL(url);
    if ((urlObj.pathname.startsWith('/m/android') || urlObj.pathname.startsWith('/m/ios'))
        && urlObj.searchParams.get('v')) {
      const v = urlObj.searchParams.get('v')!;
      const theme = urlObj.searchParams.get('theme') || "light";
      const platform = urlObj.pathname.startsWith('/m/android') ? "android":"ios"
      const test = urlObj.searchParams.get('test')!;
      return await this.handleMobilePage(platform, v,theme,!!test);
    }

    if(urlObj.pathname.startsWith("/docs")){
      const res =  await this.router.handle(request);
      const text = await res.text();
      return new Response(text.replace("<title>SwaggerUI</title>",`<title>${this.title} - SwaggerUI</title>`), {
           headers: {
          'content-type': 'text/html; charset=UTF-8',
        },
        status: 200,
      });
    }else{
      try {
        return this.router.handle(request);
      }catch (e){
        console.log("router handle ERROR",e)
        return WaiOpenAPIRoute.responseJson({
          status:500
        },500)
      }
    }
  }

  async handleMobilePage(platform: 'android' | 'ios', version: string,theme:string = "light",test:boolean = false) {
    const page = await KvCache.getInstance().get(`mobile_index_${version}.html`);
    const option = {
      status: 200,
      headers: {
        'Content-Type': test? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8',
      },
    };
    if (page) {
      return new Response(
        `<script>
                    window.__PLATFORM='${platform}';
                    window.__THEME='${theme}';
                    window.__FRONT_VERSION='${version}';
                </script>${page}`,
        option
      );
    } else {
      const t = currentTs1000();
      const res = await fetch(`https://wai.chat/version.txt?${t}`);
      const v = (await res.text()).trim();

      const home_res = await fetch(`https://wai.chat/?${t}`);
      const html = await home_res.text();
      if(v === version){
        await KvCache.getInstance().put(`mobile_index_${v.trim()}.html`, html);
        return new Response(
            `<script>
                    window.__PLATFORM='${platform}';
                    window.__THEME='${theme}';
                    window.__FRONT_VERSION='${v.trim()}';
                </script>${html}`,
            option
        );
      }else{
        return new Response(
            `Not Found ${platform},version: ${version}`,
            {
              status: 404,
            }
        );
      }
    }
  }
}
