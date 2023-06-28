import {startServers} from './server';
import {WAI_SERVER_PORT} from "../worker/setting";
import KvCache from "../worker/services/kv/KvCache";
import BigStorage from "../worker/services/storage/BigStorage";
import FileStorage from "../worker/services/storage/FileStorage";
import DbStorage from "../worker/services/db/DbStorage";
import {MysqlClient} from "../worker/services/db/MysqlClient";
import MySqlKv from "../worker/services/kv/MySqlKv";
import { getMySqlConfigFromEnv } from '../utils/env';


async function main() {
  DbStorage.getInstance().setHandler(
    new MysqlClient().setConfig(getMySqlConfigFromEnv())
  )

  KvCache.getInstance().setKvHandler(
    new MySqlKv().init(new DbStorage().setHandler( new MysqlClient().setConfig(getMySqlConfigFromEnv())))
  )
  //
  // KvCache.getInstance().setKvHandler(
  //   new LocalFileKv().init("/tmp")
  // )

  BigStorage.getInstance().setKvHandler(
    new FileStorage().init("/tmp")
  )

  await startServers(
    WAI_SERVER_PORT,
    {
      IS_DEV:true,
      IN_ELECTRON:false
    },
  );
}
main().catch(console.error);
