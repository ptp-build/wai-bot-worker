import * as net from 'net';
import { exec, spawn } from 'child_process';
import path from 'path';
import { sleep } from '../../worker/share/utils/utils';
import fetch from 'node-fetch';
import { JSON_HEADERS } from '../../worker/setting';

let __currentInstance:BotRqaServer | null = null

export class BotRqaServer {
  private port: number;
  constructor(port:number) {
    __currentInstance = this
    this.port = port
  }
  static getInstance(port?:number){
    if(!__currentInstance){
      __currentInstance = new BotRqaServer(port!)
      return __currentInstance
    }else{
      return __currentInstance
    }
  }
  async waitForServerIsOK( timeout:number = 300000) {
    const {port} = this
    const startTime = Date.now();
    while (true) {
      const timeElapsed = Date.now() - startTime;
      if (timeElapsed >= timeout) {
        throw new Error(`Timeout waiting for server to start on port ${port}`);
      }
      if (await this.isPortOpen()) {
        console.log(`Rpa Server is running on port ${port}`);
        break;
      }
      // Sleep for a bit before trying again.
      await sleep(1000);
    }
  }
  async callRpa(steps:any){
    const { port } = this;
    try {
      const url =`http://127.0.0.1:${port}`
      console.log("[waitForServerIsOK]",url)
      const response = await fetch(url,{
        method:"POST",
        headers:{
          ...JSON_HEADERS
        },
        body:JSON.stringify(steps)
      });
      console.error(response.status)
      // 如果状态码是200，那么服务器是运行的
      return response.status === 200;
    } catch (error) {
      console.error(error)
      return false;
    }
  }
  async isPortOpen() {
    //use fetch http check status is 200
    const { port } = this;
    try {
      const url =`http://127.0.0.1:${port}`
      console.log("[waitForServerIsOK]",url)
      const response = await fetch(url);
      return response.status === 200;
    } catch (error:any) {
      console.error(error.message)
      return false;
    }
  }
  async start() {
    const isPortUsed = await this.isPortOpen();
    if(isPortUsed){
      console.log("[isPortUsed] port:",this.port)
      return
    }

    let command = path.join(__dirname,"electron/assets/py/wai-bot-rpa")
    if(process.platform === "win32"){
      command += ".exe"
    }
    if (process.platform === 'win32') {
      exec(`start /B cmd.exe /C "${command}"`);
    } else if (process.platform === 'darwin') {
      spawn('chmod', ['+x',command]);
      spawn('osascript', ['-e', `tell application "Terminal" to do script "${command}"`]);
    } else {
      spawn('chmod', ['+x',command]);
      spawn('x-terminal-emulator', ['-e', command]);
    }
    this.waitForServerIsOK();
    // // 检查端口是否被占用
    // const isPortUsed = await this.isPortInUse(this.port);
    //
    // if (isPortUsed) {
    //   console.log(`[BotWsServer] Port ${this.port} is in use. Killing the process...`);
    //   await this.killProcessUsingPort(this.port!);
    // }
    //
    // const py = getPythonExecName()
    // if(!isProd){
    //   await runCommand(py,["py-wai-bot-rpa/wai-bot-rpa.py",this.port,path.join(__dirname,"rpa.log")])
    // }else{

      // await runCommand(cmd,[this.port,userDataDir+"/rpa.log"])
      // await runCommand(py,["py-wai-bot-rpa/wai-bot-rpa.py",this.port,"py-wai-bot-rpa/rpa.log"])
    // }
    return this
  }

  private isPortInUse(port: number): Promise<boolean> {
    return new Promise(resolve => {
      const server = net.createServer();
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(false);
      });

      server.listen(port);
    });
  }
  private async killProcessUsingPort(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(`lsof -i :${port} | awk 'NR!=1 {print $2}' | xargs kill -9`, error => {
        if (error) {
          console.error(`Failed to kill process on port ${port}:`, error);
          reject(error);
        } else {
          console.log(`Killed process on port ${port}`);
          resolve();
        }
      });
    });
  }
}
