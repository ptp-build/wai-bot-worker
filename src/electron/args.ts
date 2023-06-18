const minimist = require('minimist');
require('dotenv').config();
export const DefaultPartition = "default";
export interface AppArgvType{
  partitionName:string,
  appWidth:number,
  appHeight:number,
  appPosX:number,
  appPosY:number,
  homeUrl:string,
  openDevTool?:boolean,
  useProxy?:boolean,
  proxyType?:string,
  proxyIp?:string,
  proxyPort?:string,
  proxy?:string,
  proxyUsername?:string,
  proxyPassword?:string,

  startWsServer:boolean
  waiServerRqaPort:number
  waiServerHttpPort:number
  waiServerWsPort:number
  waiServerTcpPort:number
  chatGptSendPromptSleep?:number
  //
  useCloudFlareWorker:boolean
  OPENAI_API_KEY: string
  KV_NAMESPACE_BINDING_KEY?: string
  R2_STORAGE_BINDING_KEY?: string
  SERVER_USER_ID_START: string
  Access_Control_Allow_Origin: string
  DTALK_ACCESS_TOKEN_PAY: string
  WECHAT_APPID: string
  WECHAT_APPSECRET: string
  WECHAT_NOTIFY_USER: string
  WECHAT_NOTIFY_TEMPLATE_ID: string
  TG_BOT_CHAT_ID_PAY: string
  TG_BOT_TOKEN_PAY: string
  DATABASE_HOST?:string
  DATABASE_USERNAME?:string
  DATABASE_PASSWORD?:string
  SUPABASE_URL?:string
  SUPABASE_KEY?:string
  DATABASE_URL?:string
  chatGptBotWorkers?:string

  chatGptUsername?:string
  chatGptPassword?:string
  appSubWidth:number
  appSubHeight:number
  windowGap:number
}

const AppArgvKeys = [
  "chatGptUsername",
  "chatGptPassword",
  "appSubWidth","appSubHeight","windowGap",
  "homeUrl",
  "openDevTool",
  "chatGptSendPromptSleep",
  "appWidth","appHeight","appPosX","appPosY","partitionName",
  "useProxy","proxy","proxyType","proxyIp","proxyPort","proxyUsername","proxyPassword",
  "waiServerHttpPort","waiServerWsPort","waiServerTcpPort",
  "startWsServer",'waiServerRqaPort',
  "useCloudFlareWorker",
  "chatGptBotWorkers",
  "Access_Control_Allow_Origin","OPENAI_API_KEY","SERVER_USER_ID_START","TG_BOT_CHAT_ID_PAY","TG_BOT_TOKEN_PAY","WECHAT_APPID","WECHAT_APPSECRET","WECHAT_NOTIFY_TEMPLATE_ID","WECHAT_NOTIFY_USER","DTALK_ACCESS_TOKEN_PAY"
]

export const isProd = !getFromProcessEnv("WEBPACK_SERVE")

export function getAppPlatform(){
  return process.platform
}

const getDefaultValue = (value:any,defaultVal:any,type?: "int" | "boolean")=>{

  switch (type){
    case 'int':
      if(value !== undefined){
        value = parseInt(value,10)
      }
      break
    case 'boolean':
      if(value !== undefined && typeof value === 'string'){
        value = value.toLowerCase() === "true" || value === "1" || value === "on"
      }
      break
  }
  value = value !== undefined ? value : defaultVal
  return value
}

export function getFromProcessEnv(key:string){
  return process.env[key] !== undefined ?
    (process.env[key] === "" ? undefined : process.env[key])
    : undefined;
}

export function getProxyConfig(args:AppArgvType){
  let {proxy,proxyType,proxyIp,proxyPort,proxyUsername,proxyPassword} = args
  proxyType = proxyType || "http";
  let proxyRules = (proxy) || `${proxyType}://${proxyIp}:${proxyPort}`;
  const res = {
    proxyRules,
    proxyUsername,
    proxyPassword,
    proxyBypassRules: '<local>'
  };
  if(!isProd){
    console.debug("[ProxyRules]",JSON.stringify(res))
  }
  return res;
}
export function parseAppArgs():AppArgvType{
  const argv = minimist(process.argv.slice(2));

  let argvObj = {}
  AppArgvKeys.forEach(key=>{
    let value = argv[key]
    const valFromEnv = getFromProcessEnv(key)
    value = (value === undefined ) ? valFromEnv : value
    switch (key){
      case "homeUrl":
        // value = getDefaultValue(value,"https://wai.chat")
        value = getDefaultValue(value,"wai/desktop/index.html")
        break
      case "waiServerRqaPort":
        value = getDefaultValue(value,5090,'int')
      case "waiServerHttpPort":
        value = getDefaultValue(value,5080,'int')
        break
      case "waiServerWsPort":
        value = getDefaultValue(value,5081,'int')
        break
      case "waiServerTcpPort":
        value = getDefaultValue(value,5082,'int')
        break
      case "accountId":
        value = getDefaultValue(value,undefined,'int')
        break
      case "appWidth":
        value = getDefaultValue(value,300,'int')
        break
      case "appHeight":
        value = getDefaultValue(value,600,'int')
        break
      case "appSubWidth":
        value = getDefaultValue(value,300,'int')
        break
      case "appSubHeight":
        value = getDefaultValue(value,600,'int')
        break
      case "windowGap":
        value = getDefaultValue(value,10,'int')
        break
      case "appPosX":
        value = getDefaultValue(value,0,'int')
        break
      case "appPosY":
        value = getDefaultValue(value,25,'int')
        break
      case "chatGptSendPromptSleep":
        value = getDefaultValue(value,0,'int')
        break
      case "partitionName":
        if(value === undefined ){
          value = DefaultPartition
        }
        if(value !== DefaultPartition && value.toString().indexOf("persist:") === -1){
          value = "persist:" + value
        }
        break
      case "openDevTool":
        value = getDefaultValue(value,true,'boolean')
        break
      case "useCloudFlareWorker":
      case "useProxy":
      case "startWsServer":
        value = getDefaultValue(value,false,'boolean')
        break
    }
    argvObj = {
      ...argvObj,
      ...{[key]:value}
    }
  })
  return argvObj as AppArgvType
}
