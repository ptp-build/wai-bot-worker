import { BrowserWindow, screen } from 'electron';

export default class Ui{
  static getDisplaySize(mainWindow:BrowserWindow){
    if(mainWindow){
      const { x, y } = mainWindow.getBounds();
      const currentDisplay = screen.getDisplayNearestPoint({ x, y });
      const { width, height } = currentDisplay.size;
      return { width, height }
    }else{
      return {}
    }
  }
}
