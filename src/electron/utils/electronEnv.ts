import { app as application } from 'electron';

export interface EnvType{
  appPath:string,
  electronPath:string,
}

export function getElectronEnv():EnvType {
  const electronPath = process.argv[0]
  const appPath = application.getAppPath()
  return {
    electronPath,appPath
  }
}
