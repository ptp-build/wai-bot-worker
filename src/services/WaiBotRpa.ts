import { encodeToBase64 } from '../utils/utils';
import PyAutoGuiRpa from './PyAutoGuiRpa';
import { runJsCode } from '../electron';

export default class WaiBotRpa{
  async askMsg(text:string){
    const platform = "Windows_NT"
    await this.inputPrompt(text);
    await PyAutoGuiRpa.runPyCode([
      {
        cmd:"click",
        x:1,
        y:1
      },
      {
        cmd:"click",
        x:1,
        y:1
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
        keys: platform === 'Windows_NT' ? ['ctrl', 'enter'] : ['command', 'enter'],
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
