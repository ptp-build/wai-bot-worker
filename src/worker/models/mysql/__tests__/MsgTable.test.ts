import DbStorage from "../../../services/db/DbStorage";
import {MysqlClient} from "../../../services/db/MysqlClient";
import MsgTable from "../MsgTable";
import {NewMessage} from "../../../../types";
import { currentTs } from '../../../../utils/time';

describe('MsgTable', () => {
  let storage: MsgTable;

  beforeAll(async () => {
    // @ts-ignore
    DbStorage.getInstance().setHandler(new MysqlClient().setConfig( global['DBInstanceConfig']));

    storage = new MsgTable().setTable("wai_msg");
    await storage.execute("CREATE TABLE IF NOT EXISTS `wai_msg` (\n" +
      "  `id` int unsigned NOT NULL AUTO_INCREMENT,\n" +
      "  `chatId` varchar(20) DEFAULT NULL,\n" +
      "  `msgId` bigint DEFAULT NULL,\n" +
      "  `text` longtext,\n" +
      "  `inlineButtons` json DEFAULT NULL,\n" +
      "  `entities` json DEFAULT NULL,\n" +
      "  `msgDate` int DEFAULT NULL,\n" +
      "  `senderId` varchar(20) DEFAULT NULL,\n" +
      "  `isOutgoing` tinyint(1) DEFAULT NULL,\n" +
      "  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,\n" +
      "  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n" +
      "  PRIMARY KEY (`id`),\n" +
      "  UNIQUE KEY `chatId` (`chatId`,`msgId`)\n" +
      ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;");
  });


  afterAll(async () => {
    await storage.execute("DROP TABLE IF EXISTS wai_msg;");
  });



  describe("save", () => {
    it("should save a new message row and update it in the table", async () => {
      // Create a sample NewMessage object for testing
      const newMessage: NewMessage = {
        chatId: "chat456",
        msgId: 1,
        text: "Test message",
        isOutgoing: true,
        senderId: "user123",
        msgDate: currentTs(),
        inlineButtons: [],
        entities: [],
      };

      // Call the save() method to insert the message into the table
      const result1 = await storage.save(newMessage);

      // Assert that the result is not null and insertion was successful
      expect(result1).not.toBeNull();
      const updatedMessage: Partial<NewMessage> = {
        msgId: 1,
        chatId: "chat456",
        text: "Updated message",
        isOutgoing: false,

        inlineButtons: [[{test:1}]],
        entities: [{test:2}],
      };

      // Call the update() method to update the message in the table
      const result = await storage.update(updatedMessage);

      // Assert that the result is true, indicating successful update
      expect(result).toBe(true);

      // You can also assert other conditions, such as checking if the specified fields are updated
      // or retrieving the updated row from the table and comparing it with the updatedMessage object
    });
  });


  describe("getRow", () => {
    it("should retrieve the specified row from the table", async () => {
      // Create a sample NewMessage object and insert it into the table
      const newMessage: NewMessage = {
        msgId: 2,
        text: "Test message",
        isOutgoing: true,
        senderId: "user123",
        msgDate: currentTs(),
        chatId: "chat456",
        inlineButtons: [[{test:1}]],
        entities: [{test:2}],
      };
      await storage.save(newMessage);

      // Call the getRow() method to retrieve the inserted row
      const retrievedRow = await storage.getRow("chat456", 2);
      console.log(retrievedRow)
      // Assert that the retrievedRow is not null
      expect(retrievedRow).not.toBeNull();

    });

    it("should return null if the specified row does not exist", async () => {
      // Call the getRow() method with a non-existent chatId and msgId
      const retrievedRow = await storage.getRow("nonexistent", 1);
      // Assert that the retrievedRow is null
      expect(retrievedRow).toBeNull();
    });
  });


});
