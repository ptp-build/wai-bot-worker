import fs from 'fs';
import util from 'util';

// 使用 util.promisify 将 fs 的回调函数转换为返回 promise 的函数
const readFile = util.promisify(fs.readFile);
const exists = util.promisify(fs.exists);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

export async function putFileContent(filePath: string, value: any) {
  try {
    await writeFile(filePath, value);
    return true;
  } catch (error) {
    return false;
  }
}

export async function fileExists(filePath: string) {
  try {
    return await exists(filePath);
  } catch (error) {
    return null;
  }
}
export async function getFileContent(filePath: string) {
  try {
    return await readFile(filePath);
  } catch (error) {
    return null;
  }
}

export async function deleteFile(filePath: string) {
  try {
    await unlink(filePath);
  } catch (error) {
    return null;
  }
}
