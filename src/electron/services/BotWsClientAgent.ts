import { AppArgvType, parseAppArgs } from '../utils/args';
const WebSocket = require('ws');

export class BotWsClientAgent{
  private ws?:WebSocket;
  private accountId?:number;
  private msgHandler?: { sendToRenderMsg: (action: string, payload?: any) => void; sendToMainMsg: (action: string, payload?: any) => void };
  setMsgHandler(msgHandler:{
    sendToRenderMsg:(action:string,payload?:any)=>void,
    sendToMainMsg:(action:string,payload?:any)=>void
  }){
    this.msgHandler = msgHandler
    return this
  }
  start({waiServerWsPort,accountId}:AppArgvType){
    this.accountId = accountId
    const url = `ws://localhost:${waiServerWsPort}`
    console.log("[BotWsClientAgent connecting]",url)
    this.ws = new WebSocket(url);
    this.ws!.onopen = this.onConnected.bind(this);
    this.ws!.onmessage = this.onData.bind(this);
    this.ws!.onclose = this.onClose.bind(this);
    return this
  }
  onConnected(){
    console.log("[BotWsClientAgent onConnected]")
    this.ws!.send(JSON.stringify({
      action:"login",
      payload:{
        accountId:this.accountId!
      }
    }))
  }

  onData(e:any){
    console.log("[BotWsClientAgent onData]",e.data)
    const {action,payload} = JSON.parse(e.data)
    switch (action){
      case "login":
        console.log("[BotWsClientAgent] login ok!!")
        break
    }
  }

  onClose(){
    console.log("[BotWsClientAgent onClose]")
    setTimeout(()=>{
      this.start(parseAppArgs())
    },1000)
  }
  close(){
    console.log("[BotWsClientAgent close]")
    if(this.ws){
      this.ws.close();
      this.ws = undefined
    }
  }
}
