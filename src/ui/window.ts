import type { HandlerDetails } from 'electron';
import { app, BrowserWindow, ipcMain, shell, systemPreferences } from 'electron';
import windowStateKeeper from 'electron-window-state';
import path from 'path';

import { getMasterWindowHomeUrl, IS_MAC_OS, isProd } from '../utils/electronEnv';
import WindowActionsHandler from '../window/events/WindowActionsHandler';
import { ElectronAction, MasterEvents } from '../sdk/types';
import { MasterBotId } from '../sdk/setting';

let forceQuit = false;
let interval: NodeJS.Timer;

const windows = new Set<BrowserWindow>();
let __masterWindow:BrowserWindow | null = null
const CHECK_UPDATE_INTERVAL = 10 * 60 * 2;

export function createMasterWindow(url?: string) {
  const windowState = windowStateKeeper({
    defaultWidth: 1088,
    defaultHeight: IS_MAC_OS ? 700 : 750,
  });

  let x;
  let y;

  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) {
    const [currentWindowX, currentWindowY] = currentWindow.getPosition();
    x = currentWindowX + 24;
    y = currentWindowY + 24;
  } else {
    x = windowState.x;
    y = windowState.y;
  }

  let width;
  let height;

  if (currentWindow) {
    const bounds = currentWindow.getBounds();

    width = bounds.width;
    height = bounds.height;
  } else {
    width = windowState.width;
    height = windowState.height;
  }

  const window = new BrowserWindow({
    show: false,
    x,
    y,
    minWidth: 360,
    width,
    height,
    title: 'Wai Bot',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      additionalArguments:[`--botId=${MasterBotId}`,`--isProd=${isProd}`],
      preload: path.join(__dirname, 'preload.js'),
      devTools: !isProd,
      // partition:"default"
    },
  });
  window.on('page-title-updated', (event: Event) => {
    event.preventDefault();
  });

  windowState.manage(window);

  window.webContents.setWindowOpenHandler((details: HandlerDetails) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  window.on('close', (event) => {
    if (IS_MAC_OS) {
      if (forceQuit) {
        app.exit(0);
        forceQuit = false;
      } else {
        const hasExtraWindows = BrowserWindow.getAllWindows().length > 1;

        if (hasExtraWindows) {
          windows.delete(window);
        } else {
          event.preventDefault();
          window.hide();
        }
      }
    }
  });

  new WindowActionsHandler().handleAction()
  window.webContents.loadURL(url!)

  window.webContents.once('dom-ready', () => {
    window.show();
    if(!isProd){
      window.webContents.openDevTools();
    }
    if (process.env.APP_ENV === 'production') {
      setupAutoUpdates(window);
    }
  });

  windows.add(window);
  __masterWindow = window
}


export function loadLocalHtml(htmlPath:string){
  if(__masterWindow){
    __masterWindow.loadURL(`file://${__dirname}/${htmlPath}`);
  }
}

function setupAutoUpdates(window: BrowserWindow) {


}

export function setupElectronActionHandlers() {
  ipcMain.handle(ElectronAction.OPEN_NEW_WINDOW, (_, newWindowUrl: string) => {
    createMasterWindow(newWindowUrl);
  });

  ipcMain.handle(ElectronAction.GET_IS_FULLSCREEN, () => {
    const currentWindow = BrowserWindow.getFocusedWindow();
    currentWindow?.isFullScreen();
  });

  ipcMain.handle(ElectronAction.HANDLE_DOUBLE_CLICK, () => {
    const currentWindow = BrowserWindow.getFocusedWindow();
    const doubleClickAction = systemPreferences.getUserDefault('AppleActionOnDoubleClick', 'string');

    if (doubleClickAction === 'Minimize') {
      currentWindow?.minimize();
    } else if (doubleClickAction === 'Maximize') {
      if (!currentWindow?.isMaximized()) {
        currentWindow?.maximize();
      } else {
        currentWindow?.unmaximize();
      }
    }
  });
}

export function setupCloseHandlers() {
  app.on('window-all-closed', () => {
    if (!IS_MAC_OS) {
      app.quit();
    }
  });

  app.on('before-quit', (event) => {
    if (IS_MAC_OS && !forceQuit) {
      event.preventDefault();
      forceQuit = true;
      app.quit();
    }
  });

  app.on('activate', () => {
    const hasActiveWindow = BrowserWindow.getAllWindows().length > 0;

    if (!hasActiveWindow) {
      createMasterWindow(getMasterWindowHomeUrl());
    } else if (IS_MAC_OS) {
      forceQuit = false;

      const currentWindow = Array.from(windows).pop();
      currentWindow?.show();
    }
  });
}
export function getMasterWindow(){
  return __masterWindow
}
export function getMasterWindowWebContent(){
  if(getMasterWindow() && getMasterWindow()!.webContents){
    return  getMasterWindow()?.webContents!
  }else{
    return null
  }
}

