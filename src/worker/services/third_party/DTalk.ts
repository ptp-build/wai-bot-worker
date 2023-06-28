import { ENV } from '../../env';

export class DTalk {
  private token?: string;
  constructor() {
    this.token = ENV.DTALK_ACCESS_TOKEN_PAY;
  }

  async sendMessage(text: string) {
    return fetch("https://oapi.dingtalk.com/robot/send?access_token="+this.token,{
      headers:{
        "Content-Type":"application/json",
      },
      body:JSON.stringify({
        "msgtype": "text","text": {"content":"「支付通知」"+text}
      })
    })
  }
}
