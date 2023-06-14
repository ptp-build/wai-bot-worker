import { BrowserWindow } from 'electron';
import { AppArgvType } from '../utils/args';

export default class Devtool{
  private mainWindow: BrowserWindow;
  private devToolsWindow: BrowserWindow;
  private appArgv: AppArgvType;

  constructor(mainWindow:BrowserWindow,appArgv:AppArgvType) {
    this.mainWindow = mainWindow
    this.appArgv = appArgv
  }
  openDevToolInner(){
    // win.webContents.openDevTools({ mode: 'undocked' });
    //Valid options for mode are 'right', 'bottom', 'undocked', or 'detach'.
    this.mainWindow.webContents.openDevTools({mode:"bottom"});
  }
  openDevToolOuter(){
    let {mainWindow,devToolsWindow} = this
    // 打开 DevTools
    mainWindow.webContents.once('did-frame-finish-load', () => {
      mainWindow.webContents.setDevToolsWebContents(devToolsWindow.webContents);
      let mode = undefined
      if(mode){
        mainWindow.webContents.openDevTools({ mode:"detach" });
      }
    });
    const {appPosX,appPosY,appHeight} = this.appArgv
    // 创建 DevTools 窗口
    devToolsWindow = new BrowserWindow({
      x: appPosX,
      y: appPosY+ appHeight + 10,
      show: false,
    });

    // 监听 DevTools 的打开和关闭事件
    mainWindow.webContents.on('devtools-opened', () => {
      if (devToolsWindow) {
        devToolsWindow.show();
      }
    });

    mainWindow.webContents.on('devtools-closed', () => {
      if (devToolsWindow) {
        devToolsWindow.destroy();
        devToolsWindow = null;
      }
    });
  }
  open(){
    if (this.appArgv.openDevTool) {
      this.openDevToolInner()
    }
  }
  close(){
    let {devToolsWindow} =this
    // 销毁旧的 devToolsWindow
    if (devToolsWindow) {
      devToolsWindow.close();
      devToolsWindow.destroy();
      this.devToolsWindow = null;
    }
  }
}
