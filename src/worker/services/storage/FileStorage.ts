import BaseStorage from './BaseStorage';
import fs from 'fs';
import path from 'path';
import util from 'util';

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

  async put(filePath: string, data: Buffer) {
    const fullFilePath = path.join(this.getStoragePath(), filePath);

    // 注意：我们直接将 Buffer 对象传递给 writeFile 函数
    try {
      await writeFile(fullFilePath, data);
      return true;
    } catch (error) {
      return false;
    }
  }

  async get(filePath: string) {
    const fullFilePath = path.join(this.getStoragePath(), filePath);
    try {
      const fileContent = await readFile(fullFilePath);
      return fileContent;
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
