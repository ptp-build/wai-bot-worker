import DbStorage from "../../../services/db/DbStorage";
import {MysqlClient} from "../../../services/db/MysqlClient";
import UserTable, {UserTableType} from "../UserTable";

describe('UserTable', () => {
  let userTable: UserTable;

  beforeEach(async () => {
    // @ts-ignore
    DbStorage.getInstance().setHandler(new MysqlClient().setConfig( global['DBInstanceConfig']));

    userTable = new UserTable();
    const sql = "\n" +
      "    CREATE TABLE IF NOT EXISTS `wai_user` (\n" +
      "      `id` int unsigned NOT NULL AUTO_INCREMENT,\n" +
      "      `address` varchar(64) DEFAULT NULL,\n" +
      "      `token` varchar(64) DEFAULT NULL,\n" +
      "      `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,\n" +
      "      `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n" +
      "      PRIMARY KEY (`id`),\n" +
      "      UNIQUE KEY `token` (`token`)\n" +
      "  ) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;"
    await userTable.execute(sql);

  });

  afterEach(async () => {
    await userTable.execute("DROP TABLE IF EXISTS wai_user;");
  });

  test('save() should insert a row into the table', async () => {
    const row: UserTableType = {
      address: 'example@example.com',
      token: 'abcd1234',
    };

    const insertId = await userTable.save(row);

    expect(typeof insertId).toBe('number');
    expect(insertId).toBeGreaterThan(0);
  });

  test('saveRows() should insert multiple rows into the table', async () => {
    const rows: UserTableType[] = [
      {
        address: 'user1@example.com',
        token: 'abcd1234',
      },
      {
        address: 'user2@example.com',
        token: 'efgh5678',
      },
    ];

    await userTable.saveRows(rows);

    // Assert that the rows are successfully inserted
    // You can query the table and verify the expected state
  });

  test('update() should update specified fields in a row', async () => {

    const row: UserTableType = {
      address: 'example@example.com',
      token: 'abcd1234',
    };

    const insertId = await userTable.save(row);
    const isUpdated = await userTable.update({
      id:insertId,
      token: 'abcd12341',
    });

    expect(isUpdated).toBe(true);
    const rows1 = await userTable.getRow(insertId);
    expect(rows1!.token).toBe("abcd12341");

  });

  test('deleteRow() should delete a row by its id', async () => {
    const row: UserTableType = {
      address: 'example@example.com',
      token: 'abcd1234',
    };

    const insertId = await userTable.save(row);

    const isDeleted = await userTable.deleteRow(insertId);

    expect(isDeleted).toBe(true);
  });
});
