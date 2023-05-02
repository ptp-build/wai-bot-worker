// 导入 Electron 的 contextBridge 和 ipcRenderer 模块
const { contextBridge, ipcRenderer, clipboard} = require('electron');

// 使用 contextBridge 在预加载脚本中暴露一个名为 myAPI 的对象到 window 对象中
contextBridge.exposeInMainWorld('myAPI', {
    // 在 myAPI 对象中添加一个名为 sendWebSocketMessage 的方法，该方法用于发送 WebSocket 消息
    sendWebSocketMessage: (message) => {
        // 通过全局变量 window.socket 发送消息到 WebSocket 服务器
        window.socket.send(message);
    }
});

// 在全局作用域中创建 WebSocket 对象，并监听 open 和 close 事件
window.socket = new WebSocket('wss://wai-chat-bot-websocket.ptp-ai.workers.dev');
window.socket.addEventListener('open', async () => {
    console.log('WebSocket opened');
    window.dispatchEvent(new Event('executeTask'));

});
window.socket.addEventListener('close', () => {
    console.log('WebSocket closed');
});

// 添加一个 onmessage 事件监听器，触发网站的 doSomething 函数
window.socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.action === 'doSomething') {

    }
});


// 当 DOMContentLoaded 事件触发时，注入一个脚本来重写 fetch 方法
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');

    // 创建一个新的 script 元素
    const script = document.createElement('script');

    script.innerHTML = `
    
    async function task(){
        console.log("===>>>task!!!")
    }
    window.addEventListener('executeTask', async () => {
        await task();
    });
    (function() {
      console.log("originalFetch rewrite")
      const originalFetch = window.fetch;
      window.fetch = async function (...args) {
        // if(args.length > 1){
        //     const url = args[0];
        //     const {body,method} = args[1];
        //     console.log({method,url,body},args);
        // }
        console.log(args);
        const result = await originalFetch.apply(this, args);
        return result;
      };
    })();
  `;

    // 将 script 元素添加到文档的 body 元素中
    document.body.appendChild(script);
});

window.addEventListener('click', (event) => {
    ipcRenderer.send('simulate-mouse-click', { });

});
