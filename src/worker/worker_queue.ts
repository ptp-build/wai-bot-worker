import {Environment, initEnv} from './env';
import {WaiRouter} from './route';
import {QueueAction} from "./controller/QueueController";
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

export type EnvironmentDo = {
  DO_WEBSOCKET: DurableObjectNamespace;
};

const iRouter = new WaiRouter({
  title: 'Worker Queue',
  version: '1.0.1',
}).setRoute((router: any) => {
  router.post('/api/queue', QueueAction);
});

const worker = {
  async queue(batch: MessageBatch,env: Environment,ctx: ExecutionContext) {
    initEnv(env);
    for (const message of batch.messages) {
      new CloudFlareQueue().process(message).catch(console.error)
    }
  }
}

export default worker;
