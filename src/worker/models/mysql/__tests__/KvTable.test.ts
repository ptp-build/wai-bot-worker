import DbStorage from '../../../services/db/DbStorage';
import { MysqlClient } from '../../../services/db/MysqlClient';
import KvTable, {KvTableType} from "../KvTable";

describe('KvTable', () => {
  let kvTable : KvTable;

  beforeAll(async () => {
    // @ts-ignore
    DbStorage.getInstance().setHandler(new MysqlClient().setConfig( global['DBInstanceConfig']));

    // Create an instance of KvTable before creating the table
    kvTable = new KvTable();

    // Create the table
    await kvTable.execute("CREATE TABLE IF NOT EXISTS `wai_kv` (\n" +
      "  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',\n" +
      "  `value` json DEFAULT NULL,\n" +
      "  PRIMARY KEY (`name`)\n" +
      ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;");
  });

  afterAll(async () => {
    // Delete the table after running the tests
    await kvTable.execute("DROP TABLE IF EXISTS `wai_kv`;");
  });

  beforeEach(() => {
    // Create a new instance of KvTable before each test case
    kvTable = new KvTable();
  });


  describe('save the same key', () => {
    it('should save a row to the table', async () => {
      const row: KvTableType = { name: 'key1', value: ["value1"] };
      const row1: KvTableType = { name: 'key1', value: ["value2"] };
      const res = await kvTable.saveRow(row);
      const res1 = await kvTable.saveRow(row1);

      const row2 = await kvTable.getRow("key1");
      expect(row2!.value[0]).toBe(row1.value[0]);
      expect(res).toBe(true);
      expect(res1).toBe(true);
    });
  });


  describe('save', () => {
    it('should save a row to the table', async () => {
      const row: KvTableType = { name: 'key1', value: ["value1"] };
      const res = await kvTable.saveRow(row);
      expect(res).toBe(true);
    });
  });

  describe('getRow', () => {
    it('should retrieve the specified row from the table', async () => {
      const row: KvTableType = { name: 'key1', value: ['value1'] };
      await kvTable.saveRow(row);
      const result = await kvTable.getRow("key1");
      expect(result).toEqual(row);
    });
  });

  describe('deleteRow', () => {
    it('should delete the specified row from the table', async () => {
      const row: KvTableType = { name: 'key1', value: ['value1'] };
      await kvTable.saveRow(row);
      const result = await kvTable.deleteRow("key1");
      expect(result).toBe(true);
    });
  });
});
