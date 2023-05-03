import { Environment, ExecutionContext, initEnv } from './env';
import {WaiRouter} from './route';
import {ChatGptAction, ChatGptBillingUsageAction,} from './controller/ChatGptController';
import ProtoController from './controller/ProtoController';
import {TelegramBotSendMessageAction} from './controller/TelegramController';
import {WechatBotSendMessageAction} from './controller/WechatController';
import {QueueAction} from "./controller/QueueController";
import {CronAction} from "./controller/CronController";
import {DTalkBotSendMessageAction} from "./controller/DTalkController";
import {RandomAction} from "./controller/ApiController";
import {MasterAccountsAction} from "./controller/MasterController";
import CloudFlareQueue from './services/CloudFlareQueue';

export { WebSocketDurableObject } from './services/do/DoWesocketServer';

export interface Message<Body = any> {
  readonly id: string;
  readonly timestamp: Date;
  readonly body: Body;
  ack(): void;
  retry(): void;
}

export interface MessageBatch<Body = any> {
  readonly queue: string;
  readonly messages: Message<Body>[];
  ackAll(): void;
  retryAll(): void;
}


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

const worker = {
  async fetch(request:Request, env:Environment) {
    iRouter.setEnv(env);
    if (request.headers.get('upgrade') === 'websocket') {
      //@ts-ignore
      const durableObjectId = env.DO_WEBSOCKET.idFromName('/ws');
      //@ts-ignore
      const durableObjectStub = env.DO_WEBSOCKET.get(durableObjectId);
      return durableObjectStub.fetch(request);
    } else {
      return iRouter.handleRequest(request);
    }
  },
  async scheduled(event:ScheduledController, env:Environment, ctx:ExecutionContext) {
    await iRouter.setEnv(env).handleScheduled(event, ctx);
  },
  async queue(batch: MessageBatch,env: Environment,ctx: ExecutionContext) {
    initEnv(env);
    for (const message of batch.messages) {
      new CloudFlareQueue().process(message).catch(console.error)
    }
  }
}

export default worker;
