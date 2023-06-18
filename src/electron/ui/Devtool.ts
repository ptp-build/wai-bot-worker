import { BrowserWindow } from 'electron';
import { AppArgvType } from '../args';

export default class Devtool{
  private mainWindow: BrowserWindow;
  private appArgv: AppArgvType;

  constructor(mainWindow:BrowserWindow,appArgv:AppArgvType) {
    this.mainWindow = mainWindow
    this.appArgv = appArgv
  }
  openDevToolInner(){
    // win.webContents.openDevTools({ mode: 'undocked' });
    //Valid options for mode are 'right', 'bottom', 'undocked', or 'detach'.
    this.mainWindow.webContents.openDevTools({mode:"detach"});
  }
  open(){
    if (this.appArgv.openDevTool) {
      this.openDevToolInner()
    }
  }
}
