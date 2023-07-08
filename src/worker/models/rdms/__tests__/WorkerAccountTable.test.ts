import DbStorage from '../../../services/db/DbStorage';
import { MysqlClient } from '../../../services/db/MysqlClient';
import WorkerAccountTable, { WorkerAccountTableType } from '../WorkerAccountTable';
import KvCache from '../../../services/kv/KvCache';
import LocalFileKv from '../../../services/kv/LocalFileKv';
import WorkerAccount from '../../../../window/woker/WorkerAccount';
import { LocalWorkerAccountType } from '../../../../sdk/types';

describe('WorkerAccountTable', () => {
  let storage: WorkerAccountTable;


  afterEach(()=>{
    KvCache.getInstance().setKvHandler(new LocalFileKv().init("/tmp"))
  })
  beforeEach(async () => {
    // @ts-ignore
    DbStorage.getInstance().setHandler(new MysqlClient().setConfig( global['DBInstanceConfig']));
    storage = new WorkerAccountTable();
    const sql = "CREATE TABLE IF NOT EXISTS `wai_worker_account` (\n" +
      "  `botId` int unsigned NOT NULL AUTO_INCREMENT,\n" +
      "  `data` json DEFAULT NULL,\n" +
      "  `isDeleted` tinyint(1) DEFAULT NULL," +
      "  PRIMARY KEY (`botId`)\n" +
      ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;"
    await storage.execute(sql);

  });

  afterEach(async () => {
    await storage.execute("DROP TABLE IF EXISTS wai_worker_account;");
  });

  test('save() should insert a row into the table', async () => {
    const row: WorkerAccountTableType = {
      botId: 1,
      data: {
        appWidth:0,
        appHeight:0,
        appPosX:0,
        appPosY:0,
        botId:"1",
        name:"name",
        username:"username",
        bio:"bio",
        type:"chatGpt"
      },
    };

    const insertId = await storage.save(row);

    expect(typeof insertId).toBe('number');
    expect(insertId).toBeGreaterThan(0);
  });


  test('update() should update specified fields in a row', async () => {

    const row: WorkerAccountTableType = {
      botId: 1,
      data: {
        appWidth:0,
        appHeight:0,
        appPosX:0,
        appPosY:0,
        botId:"1",
        name:"name",
        username:"username",
        bio:"bio",
        type:"chatGpt"
      },
    };

    const insertId = await storage.save(row);
    const isUpdated = await storage.update({
      botId:insertId,
      data:{
        appWidth:0,
        appHeight:0,
        appPosX:0,
        appPosY:0,
        botId:"1",
        name:"name",
        username:"username",
        bio:"bio",
        type:"chatGpt"
      }
    });

    expect(isUpdated).toBe(true);
    const rows1 = await storage.getRow(insertId);

  });

  test('deleteRow() should delete a row by its id', async () => {
    const row: WorkerAccountTableType = {
      botId: 1,
      data: {
        appWidth:0,
        appHeight:0,
        appPosX:0,
        appPosY:0,
        botId:"1",
        name:"name",
        username:"username",
        bio:"bio",
        type:"chatGpt"
      },
    };

    const insertId = await storage.save(row);

    const isDeleted = await storage.deleteRow(insertId);

    expect(isDeleted).toBe(true);
  });


  it('should WorkerAccount', async () =>{
    const account1:LocalWorkerAccountType = {
      appWidth:0,
      appHeight:0,
      appPosX:0,
      appPosY:0,
      botId:"1",
      name:"name",
      username:"username",
      bio:"bio",
      type:"chatGpt"
    }
    await new WorkerAccount("1").update(account1)
    // expect(id).toEqual(1)

    const account = await new WorkerAccount("1").get()
    console.log(account)
    expect(account1.botId).toEqual("1")
    const listBot = await WorkerAccount.getBotList()
    expect(listBot.length).toEqual(1)

    const res = await WorkerAccount.deleteBotList("1")
    expect(res).toEqual(true)

  });
});
