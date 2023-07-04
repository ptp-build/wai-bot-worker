import 'v8-compile-cache';
import { app, nativeImage } from 'electron';
import path from 'path';

import { createMasterWindow, setupCloseHandlers, setupElectronActionHandlers } from './ui/window';
import {
  getElectronEnv,
  getMasterWindowHomeUrl,
  getWaiServerPort,
  IS_MAC_OS,
  IS_WINDOWS,
  isProd,
} from './utils/electronEnv';
import { setUpLogs } from './utils/logs';
import { start_electron_server } from './server/electron';
import { setComponents } from './utils/electronCommon';

setUpLogs(isProd ? "info" : "debug",getElectronEnv().userDataPath,"wai.log")

app.on('ready',async () => {
  if (IS_MAC_OS) {
    app.dock.setIcon(nativeImage.createFromPath(path.resolve(__dirname, '../public/icon-electron-macos.png')));
  }
  if (IS_WINDOWS) {
    app.setAppUserModelId(app.getName());
  }
  setComponents(isProd,getElectronEnv().userDataPath)
  await start_electron_server(getWaiServerPort())
  createMasterWindow(getMasterWindowHomeUrl());
  setupElectronActionHandlers();
  setupCloseHandlers();
});
