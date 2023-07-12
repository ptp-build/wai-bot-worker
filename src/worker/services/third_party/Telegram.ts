import { ENV } from '../../env';

export class TelegramBot {
  private token: string;
  constructor(token: string) {
    this.token = token;
  }
  async getUpdates(offset:number = 0,limit:number = 100){
    return sendGetUpdatesToTelegram(offset,limit,this.token)
  }
  async replyText(text: string, chat_id: string) {
    return sendMessageToTelegram({ text, chat_id }, this.token);
  }
  async replyUrlButton(text: string,btnTxt:string, url:string,tgChatId:string) {
    return this.replyButtons(
        text!,
        [
          [
            {
              text,
              url,
            },
          ],
        ],
        tgChatId
    )
  }

  async replyButtons(text: string, buttons: any[], chat_id: string) {
    return sendMessageToTelegram(
      {
        text,
        reply_markup: {
          inline_keyboard: buttons,
        },
        chat_id,
      },
      this.token
    );
  }

  async sendPayMsg(text: string, buttons: any[]) {
    const token = ENV.TG_BOT_TOKEN_PAY!;
    const chat_id = ENV.TG_BOT_CHAT_ID_PAY;
    return sendMessageToTelegram(
        {
          text,
          reply_markup: {
            inline_keyboard: buttons,
          },
          chat_id,
        },
        token
    );
  }
}

// 发送消息到Telegram
export async function sendTextMessageToTelegram(text: string, chat_id: string, token: string) {
  return sendMessageToTelegram(
    {
      text,
      chat_id,
    },
    token
  );
}

// 发送消息到Telegram
export async function sendMessageToTelegram(body: Record<string, any>, token: string) {
  return await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function sendGetUpdatesToTelegram(offset:number,limit:number,token:string) {
  return await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(res => res.json());
}

// 发送聊天动作到TG
export async function sendChatActionToTelegram(action:string, token:string, chat_id: string) {
  return await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id,
      action: action,
    }),
  }).then(res => res.json());
}

export async function bindTelegramWebHook(token:string, url:string) {
  return await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
    }),
  }).then(res => res.json());
}

// 获取群组管理员信息
export async function getTelegramChatAdminister(chatId: string, token: string) {
  try {
    const resp:Response = await fetch(`https://api.telegram.org/bot${token}/getChatAdministrators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chat_id: chatId }),
    })
    if (resp.ok) {
      return  await resp.json()
    }
  } catch (e) {
    console.error(e);
    return null;
  }
}
