import { app as application } from 'electron';

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
  useProxy?:boolean,
  proxyType?:string,
  proxyIp?:string,
  proxyPort?:string,
  proxy?:string,
  openDevTool?:boolean,
  proxyUsername?:string,
  proxyPassword?:string,
  accountSign?:string,
  accountId?:number,
  botWsServerPort:number
  startBotWsServer?:boolean
  startBotWsClient?:boolean
  isBotWsClientMaster?:boolean
  msgServer?:string
}

const AppArgvKeys = [
  "electronPath",
  "homeUrl",
  "openDevTool",
  "appWidth","appHeight","appPosX","appPosY","partitionName",
  "useProxy","proxyType","proxy","proxyPort","proxyUsername","proxyPassword",
  "accountSign","accountId","msgServer",
  "botWsServerPort","startBotWsClient","startBotWsServer","isBotWsClientMaster"
]
export interface EnvType{
  appPath:string,
  electronPath:string,
}
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
  let proxyRules = proxy || `${proxyType}://${proxyIp}:${proxyPort}`;
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

export function getEnv():EnvType {
  const electronPath = process.argv[0]
  const appPath = application.getAppPath()
  return {
    electronPath,appPath
  }
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
        value = getDefaultValue(value,"https://wai.chat")
        break
      case "botWsServerPort":
        value = getDefaultValue(value,1221,'int')
        break
      case "accountId":
        value = getDefaultValue(value,undefined,'int')
        break
      case "appPosX":
        value = getDefaultValue(value,0,'int')
        break
      case "appPosY":
        value = getDefaultValue(value,0,'int')
        break
      case "appWidth":
        value = getDefaultValue(value,1280,'int')
        break
      case "appHeight":
        value = getDefaultValue(value,800,'int')
        break
      case "partitionName":
        if(value === undefined ){
          value = DefaultPartition
        }
        if(value !== DefaultPartition && value.toString().indexOf("persist:") === -1){
          value = "persist:" + value
        }
        break
      case "startBotWsServer":
        value = getDefaultValue(value,true,'boolean')
        break
      case "isBotWsClientMaster":
        value = getDefaultValue(value,false,'boolean')
        break
      case "startBotWsClient":
      case "openDevTool":
      case "useProxy":
        value = getDefaultValue(value,false,'boolean')
        break
    }
    argvObj = {
      ...argvObj,
      ...{[key]:value}
    }
  })
  console.log("[AppArgs]",JSON.stringify(argvObj))
  return argvObj as AppArgvType
}
