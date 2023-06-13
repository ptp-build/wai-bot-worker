// import { doInvokeRpaApi } from '../../utils/wai-rpa';

export const getInitTheme = () => {
  //@ts-ignore
  return window.__THEME;
};

export const getWebPlatform = (): 'web' | 'ios' | 'android' | 'desktop' => {
  //@ts-ignore
  return window.__PLATFORM || 'web';
};

export const getFrontVersion = () => {
  //@ts-ignore
  return window.__FRONT_VERSION || '0.0.0';
};

export const getAppVersion = () => {
  return `${getWebPlatform()}:${getFrontVersion()}`;
};

export const isWebPlatform = async () => {
  return getWebPlatform() === 'web';
};

export type WaiBridgePostEventType =
  | 'WAI_APP_INIT'
  | 'SET_THEME'
  | 'WRITE_INPUT'
  | 'SCAN_QRCODE'
  | 'WEBVIEW_LOADING';

export type WaiBridgeRecvFromMobileEventNameType =
  | 'SHOW_WAI_BOT_SIGN_AUTH_MODAL'
  | 'WAI_WEBVIEW_INIT'
  | 'SCAN_QRCODE_RESULT';

export interface WaiBridgeRecvFromMobileEventType {
  eventName: WaiBridgeRecvFromMobileEventNameType;
  eventData: any;
}

export type EventHandlerType = (event: WaiBridgeRecvFromMobileEventType) => void;

export default class WaiBridge {
  private eventHandler?: EventHandlerType;
  constructor() { }
  setMobileEventHandler(eventHandler: EventHandlerType){
    this.eventHandler = eventHandler;
    return this
  }
  onRecMsgFromMobile(e: any) {
    const { eventName, eventData }: WaiBridgeRecvFromMobileEventType = e.detail;
    console.log('[onRecMsgFromMobile]', eventName, eventData);
    if (this.eventHandler) {
      this.eventHandler({ eventName, eventData });
    } else {
      switch (eventName) {
      }
    }
  }
  addEventListen() {
    console.log('[addEventListen] MOBILE.NOTIFY');
    document.addEventListener('MOBILE.NOTIFY', this.onRecMsgFromMobile.bind(this));
  }
  removeEventListen() {
    document.removeEventListener('MOBILE.NOTIFY', this.onRecMsgFromMobile.bind(this));
  }
  static postEvent(eventName: WaiBridgePostEventType, eventData?: any) {
    setTimeout(() => {
      console.log('WaiBridge postEvent', getWebPlatform(), eventName, eventData);
      if (getWebPlatform() === 'android') {
        // @ts-ignore
        window.WaiBridge.postEvent(eventName, eventData ? JSON.stringify(eventData) : '{}');
      }
      if (getWebPlatform() === 'ios') {
      }

      if (getWebPlatform() === 'web') {
        // doInvokeRpaApi(eventData.text);
      }
    });
  }
}
