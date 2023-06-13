import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

interface StoreOptions {
  configName: string;
  defaults: any;
}

class ElectronStorage {
  private path: string;
  private data: any;

  constructor(opts: StoreOptions) {
    const userDataPath = app.getPath('userData');
    this.path = path.join(userDataPath, opts.configName + '.json');
    this.data = this.parseDataFile(this.path, opts.defaults);
  }

  async get(key: string) {
    return this.data[key];
  }

  async put(key: string, val: any) {
    this.data[key] = val;
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }

  async delete(key: string) {
    delete this.data[key];
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
  private parseDataFile(filePath: string, defaults: any): any {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return defaults;
    }
  }
}

export default ElectronStorage;
