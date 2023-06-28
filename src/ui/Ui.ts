import { BrowserWindow, screen,dialog } from 'electron';
let displayWidth = 0
let displayHeight = 0
type Position = {
  appPosX: number;
  appPosY: number;
} | null;

/**
 * 需求：根据 accountIds.length 大小 创建窗口 每个窗口间距 10 起始 坐标 x:0,y:0 每个窗口互不遮挡
 *
 *    1: 如果 displayWidth < appPosX + appWidth 窗口换行
 *    2: 如果 displayHeight < appPosY + appWidth 不创建窗口
 * @param accountIdsLength
 * @param displayWidth
 * @param displayHeight
 * @param appWidth
 * @param appHeight
 * @param gap
 */
export function getAppPosition(accountIdsLength: number, displayWidth: number, displayHeight: number, appWidth: number, appHeight: number, gap: number): Position {
  // Calculate number of windows that can fit in a single row
  const windowsPerRow = Math.floor((displayWidth + gap) / (appWidth + gap));

  // Calculate the row number and column number for the new window
  const row = Math.floor((accountIdsLength) / windowsPerRow);
  const col = (accountIdsLength) % windowsPerRow;

  // Calculate the X and Y position
  const appPosX = col * (appWidth + gap);
  const appPosY = row * (appHeight + gap) + 25;

  // Check if there's enough space in height for a new window
  if (displayHeight < appPosY + appHeight) {
    return null; // Not enough space in height
  }

  return { appPosX, appPosY };
}


export const getErrorHtml = (
  botId:string,
  {code,message,url,stack}:{code:string,message:string,url:string,stack:string},
  proxy?:string)=>{
  console.log({code,message,url})
  console.log(stack)
  proxy = !proxy ? "" :`<div style='margin-top: 8px'>proxy</div>`
  return `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <title>Error</title>
  <script>
  function reload(){
    window.electron.invokeWorkerWindowAction("${botId}","Worker_LoadUrl",{url:"${url}"})
  }
</script>
</head>
<body>
<div id="message" style='width: 100%;height:100vh;display: flex; flex-direction:column;align-items: center;justify-content: center'>
  <h2 style='word-break:break-word'>${code}</h2>
  ${proxy}
  <div style='margin-top: 16px'>${message}</div>
  <button style='margin-top: 32px' onclick='reload()'>Retry</button>
</div>
</body>
</html>
`
}

export const getTaskWorkerHtml = ()=>{
  return `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <title>TaskWorker</title>
  <script>

</script>
</head>
<body>
<div id="message" style='width: 100%;height:100vh;display: flex; flex-direction:column;align-items: center;justify-content: center'>

TaskWorker
</div>
</body>
</html>
`
}

export const getCustomWorkerHtml = ()=>{
  return `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <title>CustomWorker</title>
  <script>

</script>
</head>
<body>
<div id="message" style='width: 100%;height:100vh;display: flex; flex-direction:column;align-items: center;justify-content: center'>

<h1>CustomWorker</h1>
<div>Pls send /setting to set up home url</div>
</div>
</body>
</html>
`
}
export default class Ui{
  static getDisplaySize(mainWindow:BrowserWindow){
    if(mainWindow){
      const { x, y } = mainWindow.getBounds();
      const currentDisplay = screen.getDisplayNearestPoint({ x, y });
      const { width, height } = currentDisplay.size;
      displayWidth = width
      displayHeight = height
      return { width, height }
    }else{
      return {}
    }
  }
  static getDisplaySizeFromCache(){
    return {
      displayWidth,displayHeight
    }
  }
  static showDialog(cb:()=>void){
      const options = {
        type: 'error',
        buttons: ['Ok'],
        defaultId: 0,
        title: 'Error',
        message: 'The server is already running on this port.',
        detail: 'Please stop the existing server before trying again.',
      };

      dialog.showMessageBox(options).then(cb);
  }
}
