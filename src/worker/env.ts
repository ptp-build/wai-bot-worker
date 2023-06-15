import CloudFlareKv from './share/db/CloudFlareKv';
import CloudFlareR2 from './share/storage/CloudFlareR2';
import BaseKv from './share/db/BaseKv';
import BaseStorage from './share/storage/BaseStorage';
import LocalFileKv from './share/db/LocalFileKv';
import FileStorage from './share/storage/FileStorage';

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export type Environment = {
  readonly MSG_QUEUE?: any;

  DO_WEBSOCKET?: DurableObjectNamespace;
  IS_PROD: boolean;
  OPENAI_API_KEY: string;
  KV_NAMESPACE_BINDING_KEY?: string;
  R2_STORAGE_BINDING_KEY?: string;
  SERVER_USER_ID_START: string;
  Access_Control_Allow_Origin: string;
  DTALK_ACCESS_TOKEN_PAY: string;
  WECHAT_APPID: string;
  WECHAT_APPSECRET: string;
  WECHAT_NOTIFY_USER: string;
  WECHAT_NOTIFY_TEMPLATE_ID: string;
  TG_BOT_CHAT_ID_PAY: string;
  TG_BOT_TOKEN_PAY: string;
  DATABASE_HOST?:string;
  DATABASE_USERNAME?:string;
  DATABASE_PASSWORD?:string;
  SUPABASE_URL?:string;
  SUPABASE_KEY?:string;
  DATABASE_URL?:string;
  useCloudFlareWorker?:boolean;
  chatGptBotWorkers?:string;
};

export let CTX: ExecutionContext;

export const ENV: Environment = {
  DO_WEBSOCKET: undefined,
  MSG_QUEUE: undefined,

  IS_PROD: true,
  OPENAI_API_KEY: '',
  KV_NAMESPACE_BINDING_KEY: 'DATABASE',
  R2_STORAGE_BINDING_KEY: 'STORAGE',
  SERVER_USER_ID_START: '20000',
  Access_Control_Allow_Origin: '*',
  DTALK_ACCESS_TOKEN_PAY: "",
  WECHAT_APPID: '',
  WECHAT_APPSECRET: '',
  WECHAT_NOTIFY_USER: '',
  WECHAT_NOTIFY_TEMPLATE_ID: '',
  TG_BOT_TOKEN_PAY:'',
  TG_BOT_CHAT_ID_PAY:'',
  useCloudFlareWorker: true,
  chatGptBotWorkers:"",
};

export let kv: BaseKv;
export let storage: BaseStorage;

export function initEnv(env: Environment,isCloudFlare:boolean = true) {
  Object.assign(ENV,env)

  if(isCloudFlare){
    kv = new CloudFlareKv();
    //@ts-ignore
    kv.init(env[ENV.KV_NAMESPACE_BINDING_KEY]);
    storage = new CloudFlareR2();
    //@ts-ignore
    storage.init(env[ENV.R2_STORAGE_BINDING_KEY]);
  }else{
    kv = new LocalFileKv();
    //@ts-ignore
    kv.init("/tmp/kv");
    storage = new FileStorage();
    //@ts-ignore
    storage.init("/tmp/storage/");
  }
}

export function setGlobalCtx(ctx: ExecutionContext) {
  CTX = ctx
}
