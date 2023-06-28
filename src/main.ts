import 'v8-compile-cache';
import {app, nativeImage} from 'electron';
import path from 'path';

import {createWindow, setupCloseHandlers, setupElectronActionHandlers} from './ui/window';
import {getElectronEnv, IS_MAC_OS, IS_WINDOWS, isProd} from './utils/electronEnv';
import KvCache from "./worker/services/kv/KvCache";
import LocalFileKv from "./worker/services/kv/LocalFileKv";
import BigStorage from "./worker/services/storage/BigStorage";
import FileStorage from "./worker/services/storage/FileStorage";
import {setUpLogs} from "./utils/logs";
import { start_electron_server } from './server/electron';
import { WAI_SERVER_PORT } from './worker/setting';
import MySqlKv from './worker/services/kv/MySqlKv';
import DbStorage from './worker/services/db/DbStorage';
import { MysqlClient } from './worker/services/db/MysqlClient';
import { getMySqlConfigFromEnv } from './utils/env';

setUpLogs(isProd ? "info" : "debug",getElectronEnv().userDataPath,"wai.log")

app.on('ready',async () => {
  if (IS_MAC_OS) {
    app.dock.setIcon(nativeImage.createFromPath(path.resolve(__dirname, '../public/icon-electron-macos.png')));
  }
  if (IS_WINDOWS) {
    app.setAppUserModelId(app.getName());
  }
  if(process.env.KV_CACHE_TYPE === "mysql"){
    KvCache.getInstance().setKvHandler(
      new MySqlKv().init(new DbStorage().setHandler( new MysqlClient().setConfig(getMySqlConfigFromEnv())))
    )
  }else{
    KvCache.getInstance().setKvHandler(new LocalFileKv().init(app.getPath("userData")))
  }

  BigStorage.getInstance().setKvHandler(new FileStorage().init(app.getPath("userData")))
  const port = process.env.WAI_SERVER_PORT || 5080
  await start_electron_server(Number(port))
  let homeUrl = app.isPackaged ? "http://127.0.0.1:"+port : "http://127.0.0.1:1234"

  createWindow(homeUrl);
  setupElectronActionHandlers();
  setupCloseHandlers();
});
