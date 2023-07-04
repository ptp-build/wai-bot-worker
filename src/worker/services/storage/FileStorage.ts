import BaseStorage from './BaseStorage';
import fs from 'fs';
import path from 'path';
import util from 'util';
const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);

export default class FileStorage extends BaseStorage {
  private storagePath?: string;
  private getStoragePath(){
    return this.storagePath!
  }
  init(storagePath: string) {
    if(!storagePath.endsWith("/")){
      storagePath += "/"
    }
    this.storagePath = storagePath + "storage";
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.getStoragePath(), { recursive: true });
    }
    return this
  }

  formatFilePath(f:string){
    return f.split("/").slice(f.split("/").length - 2).join("/")
  }
  async put(filePath: string, data: Buffer) {
    const fullFilePath = path.join(this.getStoragePath(), filePath);
    console.debug("[PUT]",this.formatFilePath(filePath))
    // 注意：我们直接将 Buffer 对象传递给 writeFile 函数
    try {
      const dirPath = path.dirname(fullFilePath);
      // Check if directory exists
      if (!fs.existsSync(dirPath)) {
        // Create directory if it doesn't exist
        await mkdir(dirPath, { recursive: true });
      }

      await writeFile(fullFilePath, data);
      return true;
    } catch (error) {
      return false;
    }
  }

  async get(filePath: string) {
    const fullFilePath = path.join(this.getStoragePath(), filePath);
    try {
      return await readFile(fullFilePath);
    } catch (error) {
      return null;
    }
  }

  async delete(filePath: string) {
    const fullFilePath = path.join(this.getStoragePath(), filePath);
    try {
      await unlink(fullFilePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}
