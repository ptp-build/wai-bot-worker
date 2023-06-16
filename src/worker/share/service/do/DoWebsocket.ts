import {ENV} from "../../../env";
import {JSON_HEADERS} from "../../../setting";
import MsgConnectionManager from '../../../../server/service/MsgConnectionManager';

export class DoWebsocket{
    getHandler(){
        if(ENV.useCloudFlareWorker){
            return ENV.DO_WEBSOCKET!.get(ENV.DO_WEBSOCKET!.idFromName('/ws'))
        }else {
            return MsgConnectionManager.getInstance()
        }
    }
    buildRequest(method:string,path:string,body?:Record<string, any>){
        method = method.toUpperCase()
        const url = 'https://wai.chat/api/do/ws/'+path
        console.log("[buildRequest]",url)
        return new Request(url, {
            method,
            headers:JSON_HEADERS ,
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    async sendMsg({toUserId,fromUserId,text,chatId}:{toUserId:string,fromUserId:string,text:string,chatId:string}){
        const request =  this.buildRequest("POST","sendMessage",{
            toUserId,
            fromUserId,
            text,
            chatId,
        });
        const handler = this.getHandler();
        return handler.fetch(request)
    }

    async sendChatGptMsg(pduBuf:Buffer,chatId:string,msgConnId:string){
        const request =  this.buildRequest("POST","sendChatGptMsg",{
            pduBuf:pduBuf.toString("hex"),chatId,msgConnId
        });
        const handler = this.getHandler();
        return handler.fetch(request)
    }
    async sendBotMsgRes(pduBuf:Buffer,toUid:string){
        const request =  this.buildRequest("POST","sendBotMsgRes",{
            pduBuf:pduBuf.toString("hex"),toUid
        });
        const handler = this.getHandler();
        return handler.fetch(request)
    }
    async getAccounts(){
        const handler = this.getHandler();
        console.log("getAccounts")
        const res = await handler.fetch(this.buildRequest("GET","__accounts"))
        // @ts-ignore
        return await res.json();
    }
}