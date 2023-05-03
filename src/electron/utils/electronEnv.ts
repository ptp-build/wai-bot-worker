import { app, app as application } from 'electron';

export interface EnvType{
  appPath:string,
  electronPath:string,
  userDataPath:string
}

export function getElectronEnv():EnvType {
  const electronPath = process.argv[0]
  const appPath = application.getAppPath()
  const userDataPath = app.getPath('userData');

  return {
    userDataPath,
    electronPath,
    appPath
  }
}
