import {WaiRouter} from './route';
import {StageMysqlPlanetscalAction, StageSupabaseDbAction,StagePgSqlNeonAction} from "./controller/StageController";
import {Environment} from "./env";

const iRouter = new WaiRouter({
  title: 'Worker Stage',
  version: '1.0.1',
}).setRoute((router: any) => {
  router.get('/api/stage/db/pgsql/neon', StagePgSqlNeonAction);
  router.get('/api/stage/db/mysql/planetscale', StageMysqlPlanetscalAction);
  router.get('/api/stage/db/supabase', StageSupabaseDbAction);
});

const worker: ExportedHandler<Environment> = {
  async fetch(request, env, ctx) {
    iRouter.setEnv(env).setCtx(ctx);
    return iRouter.handleRequest(request);
  },
}

export default worker;
