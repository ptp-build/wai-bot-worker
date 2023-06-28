import { HttpRequestStorage } from '../HttpRequestStorage';
import DbStorage from "../../../services/db/DbStorage";
import {MysqlClient} from "../../../services/db/MysqlClient";

describe('HttpRequestStorage', () => {
  let storage: HttpRequestStorage;

  beforeAll(async () => {
    // @ts-ignore
    DbStorage.getInstance().setHandler(new MysqlClient().setConfig( global['DBInstanceConfig']));
    storage = new HttpRequestStorage();

    await storage.getDb().execute("CREATE TABLE  IF NOT EXISTS `http_request` (\n" +
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
      ") ENGINE=InnoDB AUTO_INCREMENT=739 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;");
  });


  afterAll(async () => {
    await storage.getDb().execute("DROP TABLE IF EXISTS `http_request`;");
  });

  describe('add', () => {
    it('should insert a new HTTP request', async () => {
      const request = {
        msgId: 1,
        idx: 0,
        host: 'example.com111',
        path: '/api',
        url: 'https://example.com/api',
        data: '{"message":"Hello"}',
      };

      const id = await storage.add(request);

      expect(id).toBeGreaterThan(0);
    });

    it('should update an existing HTTP request', async () => {
      const existingRequest = {
        msgId: 0,
        idx: 1,
        host: 'example.com11',
        path: '/api',
        url: 'https://example.com/api',
        data: '{"message":"Hello"}',
      };

      const id = await storage.add(existingRequest);

      const updatedRequest = {
        host: 'updated-example.com',
        path: '/updated-api',
        url: 'https://updated-example.com/updated-api',
        data: '{"message":"Updated1111"}',
      };

      const success = await storage.update(id!, updatedRequest);

    });
  });
});
