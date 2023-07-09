import DbStorage from "../../../services/db/DbStorage";
import {MysqlClient} from "../../../services/db/MysqlClient";
import MsgTable from "../MsgTable";
import {ApiChatMsg} from "../../../../sdk/types";
import { currentTs } from '../../../../sdk/common/time';

describe('MsgTable', () => {
  let storage: MsgTable;

  beforeAll(async () => {
    // @ts-ignore
    DbStorage.getInstance().setHandler(new MysqlClient().setConfig( global['DBInstanceConfig']));
    storage = new MsgTable().setTable("wai_msg");
  });

  describe("save", () => {
    it("should save a new message row and update it in the table", async () => {
      // Create a sample ApiChatMsg object for testing
      const newMessage: ApiChatMsg = {
        chatId: "chat456",
        msgId: 1,
        text: "Test message",
        isOutgoing: true,
        senderId: "user123",
        msgDate: currentTs(),
        content: {},
        inlineButtons: [],
        entities: [],
      };

      // Call the save() method to insert the message into the table
      const result1 = await storage.save(newMessage);

      // Assert that the result is not null and insertion was successful
      expect(result1).not.toBeNull();
      const updatedMessage: Partial<ApiChatMsg> = {
        msgId: 1,
        chatId: "chat456",
        text: "Updated message",
        isOutgoing: false,
        content: {text:{text:"test"}},
        inlineButtons: [[{test:1}]],
        entities: [{test:2}],
      };

      // Call the update() method to update the message in the table
      const result = await storage.update(updatedMessage);

      // Assert that the result is true, indicating successful update
      expect(result).toBe(true);
      await storage.getDb().execute("drop table if exists wai_msg_chat456")
      // You can also assert other conditions, such as checking if the specified fields are updated
      // or retrieving the updated row from the table and comparing it with the updatedMessage object
    });
  });


  describe("getRow", () => {
    it("should retrieve the specified row from the table", async () => {
      // Create a sample ApiChatMsg object and insert it into the table
      const newMessage: ApiChatMsg = {
        msgId: 2,
        text: "Test message",
        isOutgoing: true,
        senderId: "user123",
        msgDate: currentTs(),
        chatId: "chat456",
        content: {text:{text:"test"}},
        inlineButtons: [[{test:1}]],
        entities: [{test:2}],
      };
      await storage.save(newMessage);

      // Call the getRow() method to retrieve the inserted row
      const retrievedRow = await storage.getRow("chat456", 2);
      console.log(retrievedRow)
      // Assert that the retrievedRow is not null
      expect(retrievedRow).not.toBeNull();
      await storage.getDb().execute("drop table if exists wai_msg_chat456")
    });

    it("should return null if the specified row does not exist", async () => {
      // Call the getRow() method with a non-existent chatId and msgId
      const retrievedRow = await storage.getRow("nonexistent", 1);
      // Assert that the retrievedRow is null
      expect(retrievedRow).toBeNull();
      await storage.getDb().execute("drop table if exists wai_msg_nonexistent")
    });
  });
});
