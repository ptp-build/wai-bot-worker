import {MysqlClient} from "./MysqlClient";

describe('MysqlClient', () => {
  let mysqlClient: MysqlClient;
  beforeAll(async () => {
    // @ts-ignore
    mysqlClient = new MysqlClient().setConfig( global['DBInstanceConfig'])

    await mysqlClient.execute("CREATE TABLE IF NOT EXISTS `http_request` (\n" +
      "  `id` int unsigned NOT NULL AUTO_INCREMENT,\n" +
      "  `idx` int DEFAULT '0',\n" +
      "  `msgId` int DEFAULT '0',\n" +
      "  `host` varchar(255) DEFAULT NULL,\n" +
      "  `path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,\n" +
      "  `url` varchar(255) DEFAULT NULL,\n" +
      "  `data` longtext,\n" +
      "  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n" +
      "  PRIMARY KEY (`id`),\n" +
      "  UNIQUE KEY `index` (`idx`,`msgId`)\n" +
      ") ENGINE=InnoDB AUTO_INCREMENT=738 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;");
  });

  afterEach(async () => {
    await mysqlClient.execute("DROP TABLE IF EXISTS `http_request`;");
    mysqlClient['connection'] = null;
  });

  describe('getConnection', () => {
    it('should return a valid connection', async () => {
      const connection = await mysqlClient.getConnection();
      expect(connection).toBeDefined();
    });
  });


  describe('query now', () => {
    it('select now();', async () => {
      const sql = 'select now();';
      const res = await mysqlClient.query(sql);
      console.log(res[0]["now()"])
      await expect(res.length).toBe(1);
    });
  });
});
