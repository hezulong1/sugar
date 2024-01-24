import { rawUserAgent } from './userAgent';

export const isFirefox = /* @__PURE__ */ rawUserAgent.includes('Firefox');
export const isWebKit = /* @__PURE__ */ rawUserAgent.includes('AppleWebKit');
export const isChrome = /* @__PURE__ */ rawUserAgent.includes('Chrome');
export const isSafari = /* @__PURE__ */ rawUserAgent.includes('Safari') && !isChrome;
/**
 * @since 0.1.2
 */
export const isWebKitWebView = isWebKit && !isChrome && !isSafari;
/**
 * @since 0.1.2
 */
export const isElectron = /* @__PURE__ */ rawUserAgent.includes('Electron/');
