import TaskTable, {TaskTableType} from "../TaskTable";
import DbStorage from "../../../services/db/DbStorage";
import {MysqlClient} from "../../../services/db/MysqlClient";

describe('TaskTable', () => {
  let taskTable: TaskTable;

  beforeEach(async () => {
    // @ts-ignore
    DbStorage.getInstance().setHandler(new MysqlClient().setConfig( global['DBInstanceConfig']));

    taskTable = new TaskTable();
    const sql = "CREATE TABLE  IF NOT EXISTS `wai_task` (\n" +
      "  `id` int unsigned NOT NULL AUTO_INCREMENT,\n" +
      "  `userId` int DEFAULT NULL,\n" +
      "  `chatId` int DEFAULT NULL,\n" +
      "  `msgId` int DEFAULT NULL,\n" +
      "  `isDone` tinyint(1) DEFAULT NULL,\n" +
      "  `isError` tinyint(1) DEFAULT NULL,\n" +
      "  `isGoing` tinyint(1) DEFAULT NULL,\n" +
      "  `msgDate` double DEFAULT NULL,\n" +
      "  PRIMARY KEY (`id`)\n" +
      ") ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;"
    await taskTable.execute(sql);

  });

  afterEach(async () => {
    await taskTable.execute("DROP TABLE IF EXISTS wai_task;");
  });

  test('save() should insert a row into the table', async () => {
    const row: TaskTableType = {
      userId:1,
      chatId: 12,
      msgId: 123,
      isGoing: false,
      isDone: true,
      isError: false,
      msgDate: 123456789.111,
    };

    const insertId = await taskTable.save(row);

    expect(typeof insertId).toBe('number');
    expect(insertId).toBeGreaterThan(0);
  });

  test('saveRows() should insert multiple rows into the table', async () => {
    const rows: TaskTableType[] = [
      {
        userId:1,
        chatId: 12,
        msgId: 123,
        isDone: true,
        isGoing: false,
        isError: false,
        msgDate: 123456789,
      },
      {
        userId:1,
        chatId: 12,
        msgId: 456,
        isGoing: false,
        isDone: false,
        isError: true,
        msgDate: 987654321,
      },
    ];

    await taskTable.saveRows(rows);

    // Assert that the rows are successfully inserted
    // You can query the table and verify the expected state
  });

  test('update() should update specified fields in a row', async () => {
    const updatedFields: Partial<TaskTableType> = {
      id: 123,
      isDone: true,
    };

    const isUpdated = await taskTable.update(updatedFields);

    expect(isUpdated).toBe(true);
  });

  test('getRow() should retrieve a row by its id', async () => {
    const row1: TaskTableType = {
      userId:1,
      chatId: 12,
      msgId: 123,
      isGoing: false,
      isDone: true,
      isError: false,
      msgDate: 123456789.111,
    };

    const insertId = await taskTable.save(row1);

    const row = await taskTable.getRow(insertId);

    expect(row).not.toBeNull();
    expect(row?.id).toBe(insertId);
  });

  test('deleteRow() should delete a row by its id', async () => {
    const row1: TaskTableType = {
      userId:1,
      chatId: 12,
      msgId: 123,
      isGoing: false,
      isDone: true,
      isError: false,
      msgDate: 123456789.111,
    };

    const insertId = await taskTable.save(row1);
    const isDeleted = await taskTable.deleteRow(insertId);
    expect(isDeleted).toBe(true);
  });
});
