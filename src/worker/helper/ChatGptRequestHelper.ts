import { MsgReq, SendBotMsgReq } from '../../lib/ptp/protobuf/PTPMsg';
import { ENV } from '../env';
import { Pdu } from '../../lib/ptp/protobuf/BaseMsg';
import MsgConnectionApiHandler from '../services/MsgConnectionApiHandler';
import { ChatGptStreamStatus, MsgAction, UserAskChatGptMsg_Type } from '../../lib/ptp/protobuf/PTPCommon/types';

export class ChatGptRequestHelper{
    private msgId?: number;
    private chatId?: string;
    constructor() {}
    async process(pdu:Pdu,authUserId:string,msgConnId:string,chatGptBotId:string){
        let { chatId, msgId,chatGpt,...other } = SendBotMsgReq.parseMsg(pdu);
        this.chatId = chatId
        this.msgId = msgId;
        if(!chatGpt){
            return
        }
        let { messages, apiKey,systemPrompt, ...modelConfig } = JSON.parse(chatGpt!);
        let customApiKey = true
        if(!apiKey){
            apiKey = ENV.OPENAI_API_KEY;
            customApiKey = false
        }
        const text = messages[messages.length - 1].content
        messages.unshift({
            role: 'system',
            content: systemPrompt,
        });
        messages.forEach((message: { date: undefined }) => {
            if (message.date !== undefined) {
                delete message.date;
            }
        });

        const pdu1 = new MsgReq({
            action:MsgAction.MsgAction_WaiChatGptUserAskMsg,
            payload:JSON.stringify({
                ...other,
                msgId,
                chatId,
                text,
                chatGptBotId,
                senderId:authUserId,
                streamStatus:ChatGptStreamStatus.ChatGptStreamStatus_WAITING
            } as UserAskChatGptMsg_Type)
        }).pack()
        if(!customApiKey){
            await MsgConnectionApiHandler.getInstance().sendChatGptMsg(msgConnId,Buffer.from(pdu1.getPbData()))
        }
    }
}
