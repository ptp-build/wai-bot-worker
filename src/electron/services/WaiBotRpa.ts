import { encodeToBase64 } from '../utils/utils';
import PyAutoGuiRpa from './PyAutoGuiRpa';
import { runJsCode } from '../index';
import { getAppPlatform, parseAppArgs } from '../utils/args';

export default class WaiBotRpa{
  async askMsg(text:string){
    const platform = getAppPlatform()
    await this.inputPrompt(text);
    const {chatGptSendPromptSleep,appHeight,appPosY,appPosX} = parseAppArgs()
    // 600 535
    const inputPostX= 20 + appPosX
    const inputPostY= appHeight - 65 + appPosY
    await PyAutoGuiRpa.runPyCode([
      {
        cmd: 'sleep',
        sec: chatGptSendPromptSleep || 0,
      },
      {
        cmd:"click",
        x:appPosX + 74,
        y:appPosY + 78
      },
      {
        cmd:"click",
        x:inputPostX,
        y:inputPostY
      },
      {
        cmd:"press",
        key:"enter"
      },
      {
        cmd: 'sleep',
        sec: 0.1,
      },
      {
        cmd: 'press',
        key: 'backspace',
      },
      {
        cmd: 'hotkey',
        keys: platform === 'win32' ? ['ctrl', 'enter'] : ['command', 'enter'],
      },
    ])
  }

  async inputPrompt(text:string){
    const dataEncode = encodeToBase64(text)
    //$("textarea").val("${dateEncode}"))))
    await runJsCode(`document.getElementById("prompt-textarea").value = decodeURIComponent(escape(atob("${dataEncode}")))`)
  }

  async loginClick(){
    await PyAutoGuiRpa.runPyCode([
      {
        cmd:"click",
        x:1,
        y:1
      },
    ])
  }
}
