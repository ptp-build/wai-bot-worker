import DbStorage from "../../services/db/DbStorage";

export class HttpRequestStorage {
  private db: DbStorage;
  private table: string;

  constructor() {
    this.table = "http_request";
    this.db = DbStorage.getInstance();
  }
  getDb(){
    return this.db
  }

  async add(request: any): Promise<number | null> {
    const sql = `
    INSERT INTO ${this.table} (msgId, idx, host, path, url, data)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      host = VALUES(host),
      path = VALUES(path),
      url = VALUES(url),
      data = VALUES(data)
  `;
    try {
      const { msgId, idx } = request;
      const params = [msgId, idx, request.host, request.path, request.url, request.data];
      const result = await this.db.execute(sql, params);
      return result.insertId;
    } catch (error) {
      console.error("Error adding HTTP request:", error);
      return null;
    }
  }

  async getOne(id: number): Promise<any | null> {
    const sql = `SELECT * FROM ${this.table} WHERE id = ?`;
    try {
      const [rows] = await this.db.query(sql, [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Error retrieving HTTP request:", error);
      return null;
    }
  }

  async getRowsBySql(sql:string): Promise<any[]> {

    try {
      const rows = await this.db.query(sql);
      return rows;
    } catch (error) {
      console.error("Error retrieving HTTP requests:", error);
      return [];
    }
  }
  async getRows(): Promise<any[]> {
    const sql = `SELECT * FROM ${this.table}`;

    try {
      const rows = await this.db.query(sql);
      return rows;
    } catch (error) {
      console.error("Error retrieving HTTP requests:", error);
      return [];
    }
  }

  async update(id: number, updatedData: any): Promise<boolean> {
    const sql = `UPDATE ${this.table} SET host = ?, path = ?, url = ?, data = ? WHERE id = ?`;
    try {
      const result = await this.db.execute(sql, [
        updatedData.host,
        updatedData.path,
        updatedData.url,
        updatedData.data,
        id,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating HTTP request:", error);
      return false;
    }
  }

  async delete(id: number): Promise<boolean> {
    const sql = `DELETE FROM ${this.table} WHERE id = ?`;

    try {
      const result = await this.db.execute(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting HTTP request:", error);
      return false;
    }
  }

}
