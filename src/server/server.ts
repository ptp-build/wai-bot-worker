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
import { ENV, Environment, kv, setKvAndStorage, storage } from '../worker/env';
import { isProd, parseAppArgs } from '../electron/utils/args';
import LocalFileKv from '../worker/share/db/LocalFileKv';
import FileStorage from '../worker/share/storage/FileStorage';
const minimist = require('minimist');

const iRouter = new WaiRouter({
  title: 'Worker Wai Chat',
  version: '1.0.1',
}).setRoute((router: any) => {
  router.post('/api/telegram/bot/sendMessage', TelegramBotSendMessageAction);
  router.post('/api/wechat/bot/sendMessage', WechatBotSendMessageAction);
  router.post('/api/dtalk/bot/sendMessage', DTalkBotSendMessageAction);

  router.get('/api/master/accounts', MasterAccountsAction);
  router.post('/api/proto', ProtoController);
});


export async function startServers(tcpPort: number, wsPort: number,httpPort:number,userDataPath?:string): Promise<void> {
  const avgs = parseAppArgs()
  const {
    chatGptBotWorkers,useCloudFlareWorker,Access_Control_Allow_Origin,
    OPENAI_API_KEY,SERVER_USER_ID_START,TG_BOT_CHAT_ID_PAY,TG_BOT_TOKEN_PAY,
    WECHAT_APPID,WECHAT_APPSECRET,WECHAT_NOTIFY_TEMPLATE_ID,WECHAT_NOTIFY_USER,DTALK_ACCESS_TOKEN_PAY} = avgs
  const env:Environment = {
    IS_PROD: isProd,
    localFileKvDir:userDataPath+"/"+"kv",
    fileStorageDir:userDataPath+"/"+"storage",
    chatGptBotWorkers,
    useCloudFlareWorker,
    Access_Control_Allow_Origin, OPENAI_API_KEY,SERVER_USER_ID_START,TG_BOT_CHAT_ID_PAY,TG_BOT_TOKEN_PAY,WECHAT_APPID,WECHAT_APPSECRET,WECHAT_NOTIFY_TEMPLATE_ID,WECHAT_NOTIFY_USER,DTALK_ACCESS_TOKEN_PAY
  }

  let kv = new LocalFileKv();
  kv.init(env.localFileKvDir);
  let storage = new FileStorage();
  storage.init(env.fileStorageDir!);
  setKvAndStorage(kv,storage)
  iRouter.setEnv(env,useCloudFlareWorker);
  const httpServer = new HttpServer(httpPort).setRoute(iRouter);
  await httpServer.start();
  console.log(`HttpServer server started: http://localhost:${httpPort}`);

  const wsServer = new WsServer(wsPort);
  wsServer.start();
  console.log(`WebSocket server started: ws://localhost:${wsPort}`);

  const tcpServer = new TcpServer(tcpPort);
  await tcpServer.start();
  console.log(`TCP server started on port: localhost:${tcpPort}`);
}

