import DbStorage from '../../../services/db/DbStorage';
import { MysqlClient } from '../../../services/db/MysqlClient';
import WorkerGroupTable, { WorkerGroupTableType } from '../WorkerGroupTable';
import KvCache from '../../../services/kv/KvCache';
import LocalFileKv from '../../../services/kv/LocalFileKv';
import WorkerGroup from '../../../../window/woker/WorkerGroup';

describe('WorkerGroupTable', () => {
  let storage: WorkerGroupTable;
  afterEach(()=>{
    KvCache.getInstance().setKvHandler(new LocalFileKv().init("/tmp"))
  })
  beforeEach(async () => {
    // @ts-ignore
    DbStorage.getInstance().setHandler(new MysqlClient().setConfig( global['DBInstanceConfig']));
    storage = new WorkerGroupTable();
    const sql = "CREATE TABLE IF NOT EXISTS `wai_worker_group` (\n" +
      "  `chatId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,\n" +
      "  `data` json DEFAULT NULL,\n" +
      "  `isDeleted` tinyint(1) DEFAULT NULL," +
      "  PRIMARY KEY (`chatId`)\n" +
      ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;"
    await storage.execute(sql);

  });

  afterEach(async () => {
    await storage.execute("DROP TABLE IF EXISTS wai_worker_group;");
  });

  test('save() should insert a row into the table', async () => {
    const row: WorkerGroupTableType = {
      chatId: "-1",
      data: {
        chatId:"1",
      },
    };

    const insertId = await storage.save(row);

    expect(insertId ).toBe(true);
  });


  test('update() should update specified fields in a row', async () => {

    const row: WorkerGroupTableType = {
      chatId: "-1",
      data: {
        chatId:"-1",
      },
    };

    await storage.save(row);
    const insertId = "-1"
    const isUpdated = await storage.update({
      chatId:insertId,
      data:{
        chatId:"1",
      }
    });

    expect(isUpdated).toBe(true);
    const rows1 = await storage.getRow(insertId);

  });

  test('deleteRow() should delete a row by its id', async () => {
    const row: WorkerGroupTableType = {
      chatId: "-1",
      data: {
        chatId:"-1",
      },
    };
    await storage.save(row);
    const insertId = "-1"

    const isDeleted = await storage.deleteRow(insertId);

    expect(isDeleted).toBe(true);
  });


  it('should WorkerGroup', async () =>{
    const account1 = {
      chatId:"-1",
    }
    await new WorkerGroup("-1").update(account1)
    // expect(id).toEqual(1)

    const account = await new WorkerGroup("-1").get()
    console.log(account)
    expect(account1.chatId).toEqual("-1")
    const listBot = await WorkerGroup.getBotList()
    expect(listBot.length).toEqual(1)

    const res = await WorkerGroup.deleteBotList("-1")
    expect(res).toEqual(true)

  });
});
