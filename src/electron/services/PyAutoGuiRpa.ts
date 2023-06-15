import { runPyCode } from '../utils/evalSystemCmd';
const importCode = `import pyautogui\nimport time`

export type PyAutoGuiClickStep = {
  cmd:"click",
  x:number,
  y:number
}

export type PyAutoGuiMoveToStep = {
  cmd:"moveTo",
  x:number,
  y:number
}

export type PyAutoGuiTypewriteStep = {
  cmd:"typewrite",
  text:string
}

export type PyAutoGuiHotkeyStep = {
  cmd:"hotkey",
  keys:string[]
}

export type PyAutoGuiPressStep = {
  cmd:"press",
  key:string
}

export type PyAutoGuiSleepStep = {
  cmd:"sleep",
  sec:number
}

export type PyAutoGuiStep = PyAutoGuiClickStep | PyAutoGuiMoveToStep |
  PyAutoGuiTypewriteStep | PyAutoGuiHotkeyStep |
  PyAutoGuiSleepStep | PyAutoGuiPressStep

export default class PyAutoGuiRpa{
  static async runPyCode(steps:PyAutoGuiStep[]){
    const codes = []
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const {cmd} = step
      switch (step.cmd){
        case "click":
        case "moveTo":
          codes.push(`pyautogui.${cmd}(${step.x},${step.y})`)
          break
        case "typewrite":
          codes.push(`pyautogui.${cmd}("${step.text}")`)
          break
        case "hotkey":
          codes.push(`pyautogui.${cmd}("${step.keys.join('","')}")`)
          break
        case "press":
          codes.push(`pyautogui.${cmd}("${step.key}")`)
          break
        case "sleep":
          codes.push(`pyautogui.${cmd}(${step.sec})`)
          break
      }
    }
    const pyCode = importCode +"\n"+ codes.join("\n")
    await runPyCode(`${pyCode}`);
  }
  async getPositionByPyAutoGui() {
    const res = await runPyCode(`import pyautogui\nimport os\nx, y = pyautogui.position()\ncontent = f'{x},{y}'\nprint(content)`);
    if(res){
      return res.split(",").map(Number)
    }else{
      return {};
    }
  }
}
