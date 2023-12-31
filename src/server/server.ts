import {WaiRouter} from '../worker/route';
import {Environment} from '../worker/env';
import {WaiAction} from "../worker/controller/WaiController";
import {WaiServer} from "./service/WaiServer";

const iRouter = new WaiRouter({
  title: 'Wai Bot Worker',
  version: '1.0.1',
}).setRoute((router: any) => {
  router.post('/api/wai', WaiAction);
});

export async function startServers(
  port:number,
  env:Environment,
  ): Promise<void> {
  iRouter.setEnv(env);
  const server = new WaiServer(port).setRoute(iRouter).setEnableWebSite(false);
  await server.start();
  console.log(`HttpServer server started: http://127.0.0.1:${port}`);
  console.log(`WebSocket server started: ws://127.0.0.1:${port}`);
}

