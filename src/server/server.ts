import { TCP_SERVER_PORT, WS_SERVER_PORT,HTTP_SERVER_PORT } from './config';
import { TcpServer } from './service/TcpServer';
import { WsServer } from './service/WsServer';
import { HttpServer } from './service/HttpServer';
import { WaiRouter } from '../worker/route';
import { ChatGptAction, ChatGptBillingUsageAction } from '../worker/controller/ChatGptController';
import { CronAction } from '../worker/controller/CronController';
import { QueueAction } from '../worker/controller/QueueController';
import { TelegramBotSendMessageAction } from '../worker/controller/TelegramController';
import { WechatBotSendMessageAction } from '../worker/controller/WechatController';
import { DTalkBotSendMessageAction } from '../worker/controller/DTalkController';
import { RandomAction } from '../worker/controller/ApiController';
import { MasterAccountsAction } from '../worker/controller/MasterController';
import ProtoController from '../worker/controller/ProtoController';
const minimist = require('minimist');

const iRouter = new WaiRouter({
  title: 'Worker Wai Chat',
  version: '1.0.1',
}).setRoute((router: any) => {
  router.post('/api/chatgpt/v1/chat/completions', ChatGptAction);
  router.post('/api/chatgpt/usage', ChatGptBillingUsageAction);

  router.post('/api/cron', CronAction);
  router.post('/api/queue', QueueAction);

  router.post('/api/telegram/bot/sendMessage', TelegramBotSendMessageAction);
  router.post('/api/wechat/bot/sendMessage', WechatBotSendMessageAction);
  router.post('/api/dtalk/bot/sendMessage', DTalkBotSendMessageAction);
  router.get('/api/utils/random', RandomAction);

  router.get('/api/master/accounts', MasterAccountsAction);
  router.post('/api/proto', ProtoController);
});


export async function startServers(tcpPort: number, wsPort: number,httpPort:number): Promise<void> {
  const argv = minimist(process.argv.slice(2));

  console.log(process.env)
  const tcpServer = new TcpServer(tcpPort);
  await tcpServer.start();
  console.log(`TCP server started on port ${tcpPort}`);

  const wsServer = new WsServer(wsPort);
  wsServer.start();
  console.log(`WebSocket server started on port ${wsPort}`);

  const httpServer = new HttpServer(httpPort,iRouter);
  await httpServer.start();
  console.log(`HttpServer server started http://localhost:${httpPort}`);
}

