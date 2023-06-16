import {WaiRouter} from './route';
import {CronAction} from "./controller/CronController";
import { Environment, ExecutionContext } from './env';

export { WebSocketDurableObject } from './services/do/DoWesocketServer';


const iRouter = new WaiRouter({
  title: 'Worker Queue',
  version: '1.0.1',
}).setRoute((router: any) => {
  router.post('/api/cron', CronAction);
});

const worker = {

  async scheduled(event:ScheduledController, env:Environment, ctx:ExecutionContext) {
    await iRouter.setEnv(env).handleScheduled(event, ctx);
  },
}

export default worker;
