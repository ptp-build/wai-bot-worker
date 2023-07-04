import { BrowserWindow } from 'electron';

export default class Devtool{
  private mainWindow: BrowserWindow;

  constructor(mainWindow:BrowserWindow) {
    this.mainWindow = mainWindow
  }
  openDevToolInner(){
    this.open("detach")
  }
  open(mode:'left' | 'right' | 'bottom' | 'undocked' | 'detach' = "undocked"){
    if(!this.mainWindow.webContents.isDevToolsOpened()){
      this.mainWindow.webContents.openDevTools({mode:"detach"});
    }else{
      this.mainWindow.webContents.closeDevTools()
    }
  }
}
