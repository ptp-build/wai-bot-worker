import { BrowserWindow } from 'electron';

export default class Devtool{
  private mainWindow: BrowserWindow;

  constructor(mainWindow:BrowserWindow) {
    this.mainWindow = mainWindow
  }
  openDevToolInner(){
    this.mainWindow.webContents.openDevTools({mode:"detach"});
  }
  open(){
    this.openDevToolInner()
  }
}
