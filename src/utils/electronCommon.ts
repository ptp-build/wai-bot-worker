import KvCache from '../worker/services/kv/KvCache';
import MySqlKv from '../worker/services/kv/MySqlKv';
import DbStorage from '../worker/services/db/DbStorage';
import { MysqlClient } from '../worker/services/db/MysqlClient';
import { getMySqlConfigFromEnv } from './env';
import LocalFileKv from '../worker/services/kv/LocalFileKv';
import BigStorage from '../worker/services/storage/BigStorage';
import FileStorage from '../worker/services/storage/FileStorage';

export function setComponents(isProd:boolean,userDataPath:string){
  if(!isProd){
    KvCache.getInstance().setKvHandler(
      new MySqlKv().init(new DbStorage().setHandler( new MysqlClient().setConfig(getMySqlConfigFromEnv())))
    )
  }else{
    KvCache.getInstance().setKvHandler(new LocalFileKv().init(userDataPath))
  }
  DbStorage.getInstance().setHandler(new MysqlClient().setConfig(getMySqlConfigFromEnv()))
  BigStorage.getInstance().setKvHandler(new FileStorage().init(userDataPath))
}
