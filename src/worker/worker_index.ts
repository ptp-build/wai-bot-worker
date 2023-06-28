import {ENV, Environment} from './env';
import {WaiRouter} from './route';
import {WaiAction} from "./controller/WaiController";
import KvCache from "./services/kv/KvCache";
import CloudFlareKv from "./services/kv/CloudFlareKv";
import DbStorage from "./services/db/DbStorage";
import {MySqlPlanetScale} from "./services/db/MySqlPlanetScale";
import {DevAction} from "./controller/DevController";
const iRouter = new WaiRouter({
  title: 'Wai Bot Worker',
  version: '1.0.1',
}).setRoute((router: any) => {
  router.post('/api/wai', WaiAction);
  router.post('/api/dev', DevAction);
});

const worker = {
  async fetch(request:Request, env:Environment) {
    iRouter.setEnv(env);
    if(ENV.KV_NAMESPACE_BINDING_KEY){
      //@ts-ignore
      const kv = env[ENV.KV_NAMESPACE_BINDING_KEY]
      KvCache.getInstance().setKvHandler(
        new CloudFlareKv().init(kv)
      )
    }else{
    }
    if(!ENV.IS_DEV){
      DbStorage.getInstance().setHandler(
        new MySqlPlanetScale().setConfig({
          host: ENV.DATABASE_HOST!,
          username:ENV.DATABASE_USERNAME!,
          password:ENV.DATABASE_PASSWORD!,
        })
      )
    }else{
      // DbStorage.getInstance().setHandler(
      //   new MysqlClient().setConfig({
      //     database: "wai",
      //     host: "127.0.0.1",
      //     user: "root",
      //     password: "root",
      //   })
      // )
    }
    return iRouter.handleRequest(request);
  },
}

export default worker;
