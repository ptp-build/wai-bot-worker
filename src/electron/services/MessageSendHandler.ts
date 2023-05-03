import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';

const msgList:Pdu[] = []
let handleSendMsgIsRun = false

function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
          await sleep(200)
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
