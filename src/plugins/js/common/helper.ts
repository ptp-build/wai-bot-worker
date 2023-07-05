import { GetFileDataType, SaveFileDataType } from '../../../types';
import BridgeMasterWindow from '../../../bridge/BridgeMasterWindow';


export async function arrayBufferToBase64(arrayBuffer:ArrayBuffer,type?:string) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([arrayBuffer],{type});
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(blob);
  });
}

export function arrayBufferToHex(arrayBuffer:ArrayBuffer):Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([arrayBuffer]);
    const reader = new FileReader();

    reader.onloadend = () => {
      const dataView = new DataView(<ArrayBuffer>reader.result);
      let hexString = '';

      for (let i = 0; i < dataView.byteLength; i++) {
        const hex = dataView.getUint8(i).toString(16).padStart(2, '0');
        hexString += hex;
      }

      resolve(hexString);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(blob);
  });
}

export function saveFileData(botId:string,payload:SaveFileDataType) {
  return new BridgeMasterWindow(botId).saveFileData(payload)
}

export function getFileData(botId:string,payload:GetFileDataType) {
  return new BridgeMasterWindow(botId).getFileData(payload);
}


/**
 * Sleeps a specified amount of time
 * @param ms time in milliseconds
 * @returns {Promise}
 */
export const sleep = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });


export function currentTs(){
  return Math.ceil(+(new Date)/1000)
}

export function currentTs1000(){
  return Math.ceil(+(new Date))
}
