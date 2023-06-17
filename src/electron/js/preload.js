const { contextBridge, ipcRenderer } = require("electron");
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(-3);
const IpcMainCallbackButtonAction = "ipcMainCallbackButton";

const botId = args[0]
const chatGptUsername = args[1]
const chatGptPassword = args[2]

console.log("[Preload]",window.location.href,botId)

class ElectronIpcRender{
  addEvents(){
    console.log("[ElectronIpcRender addEvents!!!]")
    ipcRenderer.on('ipcRenderMsg', (event, action,payload) => {
      console.log('[ipcRenderMsg]', action,payload);
      window.dispatchEvent(new CustomEvent('ipcJsMsg', {detail:{action,payload}} ));
    });
  }
}

contextBridge.exposeInMainWorld('WaiApi', {
  onJsMsg: (action, payload) => {
    console.debug("onJsMsg",action,payload)
    ipcRenderer.send('ipcMainMsg',action,{__botId:botId,...(payload||{})});
  },
});

async function readAppendFile(name){
  try {
    const filePath = path.join(__dirname, name);
    const code = await fs.promises.readFile(filePath, 'utf8');
    const script = document.createElement('script');
    script.textContent = `
  const __botId = ${botId};
  const __chatGptUsername = "${chatGptUsername}";
  const __chatGptPassword = "${chatGptPassword}";
  console.log("[args inject!]");
  `+code;
    document.body.appendChild(script);
  } catch (err) {
    console.error(`Error reading ${name}:`, err);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[DOMContentLoaded] event fired',window.version);
  await readAppendFile("zepto.js")
  await readAppendFile("worker.js")
});


document.addEventListener('dblclick', (event) => {
  try {
    const {clientX,clientY,pageX,pageY,screenX,screenY} = event
    const {innerWidth,innerHeight} = window;
    ipcRenderer.send('ipcMainMsg',IpcMainCallbackButtonAction,{
      __botId:botId,
      data:"ipcMain/getSize",
      eventData:{innerWidth,innerHeight,clientX,clientY,pageX,pageY,screenX,screenY}
    })
  }catch (e){

  }
})

new ElectronIpcRender().addEvents()
