import UserMsgTable, {UserMsgTableType} from "../UserMsgTable";
import DbStorage from "../../../services/db/DbStorage";
import {MysqlClient} from "../../../services/db/MysqlClient";

describe('UserMsgTable', () => {
  let userMsgTable: UserMsgTable;

  beforeEach(async () => {
    // @ts-ignore
    DbStorage.getInstance().setHandler(new MysqlClient().setConfig( global['DBInstanceConfig']));

    userMsgTable = new UserMsgTable();
    const sql = "CREATE TABLE IF NOT EXISTS `wai_user_msg` (\n" +
      "  `userId` int NOT NULL,\n" +
      "  `msgId` int NOT NULL,\n" +
      "  PRIMARY KEY (`userId`,`msgId`)\n" +
      ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;"
    await userMsgTable.execute(sql);

  });

  afterEach(async () => {
    await userMsgTable.execute("DROP TABLE IF EXISTS wai_user_msg;");

  });
  test('genMsgId() should generate a new msgId for the given userId', async () => {
    // Define the test userId
    await userMsgTable.save({userId:1,msgId:1});
    await userMsgTable.save({userId:1,msgId:2});
    await userMsgTable.save({userId:1,msgId:3});

    // Generate a new msgId for the userId
    const newMsgId = await userMsgTable.genMsgId(1);
    expect(newMsgId).toBe(4)
  });
});
