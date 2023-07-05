import ServerSession from "./ServerSession";
import BaseObject from "./BaseObject";
import KvCache from "./kv/KvCache";
import {MasterEventActions} from "../../sdk/types";

export default class ServerLoop extends BaseObject{
  constructor(session:ServerSession) {
    super(session)
  }

  static async genLoopId(accountAddress:string) {
    let value = await KvCache.getInstance().get(`LOOP_INCR_${accountAddress}`);
    if (!value) {
      value = 0;
    } else {
      value = parseInt(value) + 1;
    }
    await KvCache.getInstance().put(`LOOP_INCR_${accountAddress}`, value.toString());
    return value.toString();
  }

  static async addItem(accountAddress:string,action:MasterEventActions,payload:any) {
    const loopId = await ServerLoop.genLoopId(accountAddress)
    await KvCache.getInstance().put(`ServerLoop_${accountAddress}_${loopId}`,{action,payload})
    await KvCache.getInstance().put(`ServerLoop_${accountAddress}_currentLoopId`,loopId.toString())
  }
  async process(loopId:number){
    const accountAddress = this.getSession().getAccountAddress()
    const loopIdStr = await KvCache.getInstance().get(`ServerLoop_${accountAddress}_currentLoopId`)
    const serverLoopId = loopIdStr ? Number(loopIdStr) : 0
    let actions = []
    if(loopId < serverLoopId){
      const maxId = loopId + 5 > serverLoopId ? serverLoopId : loopId + 5
      console.log("loopIdStr",{loopId,serverLoopId,maxId})
      for (let i = 0; i < 5; i++) {
        loopId += 1
        const res = await KvCache.getInstance().get(`ServerLoop_${accountAddress}_${loopId}`)
        if(res){
          const {action,payload} = res;
          actions.push({action,payload})
        }
        if(loopId >= maxId){
          break
        }
      }
    }

    return {
      loopId,
      actions
    }
  }
}
