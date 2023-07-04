import BaseTable from "./BaseTable";

export type UserTableType = {
  id?:number;
  address:string;
  token:string;
}

export default class UserTable extends BaseTable{
  constructor() {
    super("wai_user");
  }

  async save(row:UserTableType){
    const sql = `
    INSERT INTO ${this.getTable()} (address,token)
    VALUES (?, ?)`;
    try {
      const { address,token} = row;
      const params = [address,token];
      const result = await this.getDb().execute(sql, params);
      return result.insertId;
    } catch (error) {
      console.error("Error adding row:", error);
      return null;
    }
  }
  async saveRows(rows:UserTableType[]){
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      await this.save(row)
    }
  }

  async update(row: Partial<UserTableType>) {
    const { id,address, ...updatedFields } = row;
    const setValues = Object.entries(updatedFields)
      .map(([key, value]) => `${key} = ?`)
      .join(", ");

    const sql = `
    UPDATE ${this.getTable()}
    SET ${setValues}
    WHERE id = ?`;
    try {
      const params = [...Object.values(updatedFields), id];
      await this.getDb().execute(sql, params);
      return true;
    } catch (error) {
      console.error("Error updating row:", error);
      return false;
    }
  }

  async getRow(id: number): Promise<UserTableType | null> {
    const sql = `
    SELECT *
    FROM ${this.getTable()}
    WHERE id = ?
    LIMIT 1`;

    try {
      const result = await this.getDb().query(sql, [id]);
      if (result.length > 0) {
        return result[0] as UserTableType;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error retrieving row:", error);
      return null;
    }
  }


  async getRowByToken(token: string): Promise<UserTableType | null> {
    const sql = `
    SELECT *
    FROM ${this.getTable()}
    WHERE token = ?
    LIMIT 1`;

    try {
      const result = await this.getDb().query(sql, [token]);
      if (result.length > 0) {
        return result[0] as UserTableType;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error retrieving row:", error);
      return null;
    }
  }

  async deleteRow(id: number): Promise<boolean> {
    const sql = `DELETE FROM ${this.getTable()} WHERE id = ?`;
    try {
      const result = await this.getDb().execute(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting:", error);
      return false;
    }
  }
}
