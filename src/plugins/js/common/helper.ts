import { GetFileDataType, MasterEventActions, SaveFileDataType, WorkerEventActions } from '../../../types';

export const sendActionToMasterWindow = async (botId: string, action: MasterEventActions, payload: any) => {
  return window.electron?.invokeMasterWindowAction(botId, action, payload);
};

export const sendKeyboardEventActionToWorkerWindow = async (botId: string, type: any, keyCode: string) => {
  return window.electron?.invokeWorkerWindowKeyboardEventAction(botId, type, keyCode);
};


export const sendMouseEventActionToWorkerWindow = async (botId: string,payload: any) => {
  return window.electron?.invokeWorkerWindowMouseEventAction(botId, payload);
};

export const sendActionToWorkerWindow = async (botId: string,action:WorkerEventActions,payload: any) => {
  return window.electron?.invokeWorkerWindowAction(botId,action, payload);
};


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
  return sendActionToMasterWindow(botId, MasterEventActions.SaveFileData, payload).catch(console.error);
}

export function getFileData(botId:string,payload:GetFileDataType) {
  return sendActionToMasterWindow(botId, MasterEventActions.GetFileData, payload).catch(console.error);
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
