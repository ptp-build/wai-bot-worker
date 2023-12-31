import {startServers} from './server';
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
  const port = process.env.WAI_SERVER_PORT || 5088
  await startServers(
    Number(port),
    {
      IS_DEV:true,
      IN_ELECTRON:false
    },
  );
}
main().catch(console.error);
