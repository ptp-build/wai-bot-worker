import { app } from 'electron';

export interface EnvType{
  electronPath:string,
  appDataPath:string,
  userDataPath:string,
  logsPath:string,
  tempPath:string
}

export function getWaiServerPort(){
  return  Number(process.env.WAI_SERVER_PORT || 5080)
}

export function getMasterWindowHomeUrl(){
  const port = getWaiServerPort()
  return app.isPackaged ? "http://127.0.0.1:" + port : "http://127.0.0.1:1234"
}

export function getElectronEnv():EnvType {
  const electronPath = process.argv[0]
  const userDataPath = app.getPath('userData');
  const appDataPath = app.getPath('appData');
  const tempPath = app.getPath('temp');
  const logsPath = app.getPath('logs');

  return {
    electronPath,
    appDataPath,
    userDataPath,
    tempPath,
    logsPath
  }
}

export function getAppPlatform(){
  return process.platform
}
export const IS_MAC_OS = process.platform === 'darwin';
export const IS_WINDOWS = process.platform === 'win32';
export const IS_LINUX = process.platform === 'linux';
export const isProd = app.isPackaged
