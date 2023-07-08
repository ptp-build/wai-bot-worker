import { ElectronApi, MasterEventActions, RenderActions, WorkerEventActions } from '../types';
import { MasterBotId } from '../setting';


export default class Bridge{
  private bridge: ElectronApi;
  private readonly botId: string;
  constructor(botId?:string) {
    if(!botId){
      botId = MasterBotId
    }
    this.botId = botId
    //@ts-ignore
    this.bridge = window.electron!
  }
  async invokeWorkerWindowAction(action:WorkerEventActions,payload?:any){
    return await this.bridge.invokeWorkerWindowAction(this.botId, action, payload) || {};
  }
  async invokeRenderBridgeAction(action:RenderActions,payload?:any){
    return await this.bridge.invokeRenderBridgeAction(this.botId, action, payload || {});
  }

  async invokeMasterWindowAction(action:MasterEventActions,payload?:any){
    return await this.bridge.invokeMasterWindowAction(this.botId, action, payload) || {};
  }

  async invokeWorkerWindowKeyboardEventAction(type:string,keyCode:string){
    return await this.bridge.invokeWorkerWindowKeyboardEventAction(this.botId, type, keyCode);
  }
  async invokeWorkerWindowMouseEventAction(payload?:any){
    return await this.bridge.invokeWorkerWindowMouseEventAction(this.botId, payload || {});
  }
}
