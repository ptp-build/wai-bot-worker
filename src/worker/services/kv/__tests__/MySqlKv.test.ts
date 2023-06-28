import { MysqlClient } from '../../db/MysqlClient';
import MySqlKv from "../MySqlKv";
import DbStorage from "../../db/DbStorage";


describe('MySqlKv', () => {

  let mySqlKv:MySqlKv;
  let mysqlClient:MysqlClient;

  beforeAll(async () => {

    // @ts-ignore
    mysqlClient = new MysqlClient().setConfig( global['DBInstanceConfig'])
    mySqlKv = new MySqlKv().init(new DbStorage().setHandler(mysqlClient))

    await mysqlClient.execute("CREATE TABLE IF NOT EXISTS `wai_kv` (\n" +
      "  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',\n" +
      "  `value` json DEFAULT NULL,\n" +
      "  PRIMARY KEY (`name`)\n" +
      ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;");
  });

  afterAll(async () => {
    await mysqlClient.execute("DROP TABLE IF EXISTS `wai_kv`;");
  });

  describe('get', () => {
    it('should retrieve the value for the given key', async () => {
      const key = 'key1';
      const value = 'value1';
      await mySqlKv.put(key,value);
      const result = await mySqlKv.get(key);
      expect(result).toEqual(value);

      const result1 = await mySqlKv.get("test");
      expect(result1).toEqual(null);

      const result2 = await mySqlKv.delete(key);
      expect(result2).toEqual(true);

      const result3 = await mySqlKv.get(key);
      expect(result3).toEqual(null);
    });

    describe('get', () => {
      it('should retrieve the int value for the given key', async () => {
        const key = 'key1';
        const value = 1;
        await mySqlKv.put(key,value);
        const result = await mySqlKv.get(key);
        expect(result).toEqual(value);
      });
    });

    describe('get', () => {
      it('should retrieve the bool value for the given key', async () => {
        const key = 'key1';
        const value = true;
        await mySqlKv.put(key,value);
        const result = await mySqlKv.get(key);
        expect(result).toEqual(value);
      });
    });

    describe('get', () => {
      it('should retrieve the object value for the given key', async () => {
        const key = 'key1';
        const value = {test:1};
        await mySqlKv.put(key,value);
        const result = await mySqlKv.get(key);
        expect(result.test).toEqual(value.test);
      });
    });
  });
});
