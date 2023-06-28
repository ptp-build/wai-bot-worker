import {MasterEventActions, WorkerEventActions} from "../../../types";


export const sendActionToMasterWindow = async (botId: string, action: MasterEventActions, payload: any) => {
  await window.electron?.invokeMasterWindowAction(botId, action, payload);
};

export const sendKeyboardEventActionToWorkerWindow = async (botId: string, type: any, keyCode: string) => {
  await window.electron?.invokeWorkerWindowKeyboardEventAction(botId, type, keyCode);
};


export const sendMouseEventActionToWorkerWindow = async (botId: string,payload: any) => {
  await window.electron?.invokeWorkerWindowMouseEventAction(botId, payload);
};

export const sendActionToWorkerWindow = async (botId: string,action:WorkerEventActions,payload: any) => {
  await window.electron?.invokeWorkerWindowAction(botId,action, payload);
};
