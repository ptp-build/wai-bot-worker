import { sendKeyboardEventActionToWorkerWindow, sendMouseEventActionToWorkerWindow, sleep } from './helper';

interface Icon {
  rel: string;
  url: string;
  width?: number;
  height?: number;
}

interface Meta {
  name?: string;
  property?: string;
  content: string;
}

interface Logo {
  width?: number;
  height?: number;
  url?: string;
  dataUri?: string;
}

interface SiteInfo {
  icons: Icon[];
  meta: Meta[];
  logo?: Logo;
}

export default class BaseKeyboardAndMouseEvents {
  public botId: string;

  constructor(botId:string) {
    this.botId = botId
  }

  sendKeyboardEvent(type: 'char' | 'keyUp' | 'keyDown', keyCode: string) {
    return sendKeyboardEventActionToWorkerWindow(this.botId, type, keyCode).catch(console.error);
  }

  sendCharKeyboardEvent(keyCode: string) {
    return this.sendKeyboardEvent('char', keyCode);
  }

  async sendClick({left,top}:{left:number,top:number},offset:number = 10,sleepMs:number = 100) {
    await this.sendMouseEvent("left","mouseDown",left + offset,top + offset)
    await sleep(sleepMs)
    await this.sendMouseEvent("left","mouseUp",left + offset,top + offset)
    await sleep(sleepMs)
    await this.sendEnterKeyboardEvent()
  }
  sendMouseEvent(button:"left" | "right", type:"mouseDown"| "mouseUp", x:number, y:number) {
    return sendMouseEventActionToWorkerWindow(this.botId, {
      button,
      type,
      x,
      y
    }).catch(console.error);
  }

  sendEnterKeyboardEvent() {
    return this.sendCharKeyboardEvent('\u000d');
  }
  sendSpaceKeyboardEvent() {
    return this.sendCharKeyboardEvent('\u0020');
  }
  sendBackSpaceKeyboardEvent() {
    return this.sendCharKeyboardEvent('\u0008');
  }
  sendTabKeyboardEvent() {
    return this.sendCharKeyboardEvent('\u0009');
  }
  sendEscKeyboardEvent() {
    return this.sendCharKeyboardEvent('\u001b');
  }
}
