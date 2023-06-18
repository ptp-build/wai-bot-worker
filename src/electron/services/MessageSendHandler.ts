import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';
import { sleep } from '../../worker/share/utils/utils';

const msgList:Pdu[] = []
let handleSendMsgIsRun = false

export default class MessageSendHandler{
  static addMsg(msg:Pdu){
    msgList.push(msg)
  }
  static getMsgList(){
    return msgList
  }
  static async handleSendMsg(msg:Pdu,handlder:(msg:Pdu)=>Promise<boolean>){
    MessageSendHandler.addMsg(msg)
    let i = 0;
    if(handleSendMsgIsRun){
      return
    }
    while (msgList.length > 0){
      handleSendMsgIsRun = true
      const msg = msgList.shift()
      i++
      if(msg){
        const res = await handlder(msg)
        // console.log("handleSendMsg res",i,res)
        if(!res){
          console.log("handleSendMsg... left messages:",msgList.length,i)
          await sleep(1000)
          msgList.unshift(msg)
        }
      }else{
        console.log("handleSendMsg finished",i)
        break
      }
    }
    handleSendMsgIsRun =false
  }
}
