import { userAgent } from './userAgent';

/**
 * platform
 */
export const isAndroid = /* @__PURE__ */ userAgent.includes('android');
export const isOS = /* @__PURE__ */ /(iphone|ipad|ipod|ios)/.test(userAgent);
export const isWindowsPhone = /* @__PURE__ */ userAgent.includes('windows phone');
export const isSymbianos = /* @__PURE__ */ userAgent.includes('symbianos');
export const isMobile = /* @__PURE__ */ isAndroid || isOS || isWindowsPhone || isSymbianos;
// export const isMac = /Mac/.test(navigator.platform)
export const isMac = /* @__PURE__ */ /macintosh|mac os x/.test(userAgent);
export const isWindow32 = /* @__PURE__ */ userAgent.indexOf('win32') || userAgent.indexOf('wow32');
export const isWindow64 = /* @__PURE__ */ userAgent.indexOf('win64') || userAgent.indexOf('wow64');
/**
 * @deprecated use {@link isWindows} instead.
 * @since 0.1.2
 */
export const isWindow = isWindow64 || isWindow32;
/**
 * platform
 * @since 0.1.2
 */
export const isMacintosh = /* @__PURE__ */ userAgent.includes('macintosh');
/**
 * platform
 * @since 0.1.2
 */
export const isWindows = /* @__PURE__ */ userAgent.includes('windows');
/**
 * platform
 * @since 0.1.2
 */
export const isLinux = /* @__PURE__ */ userAgent.includes('linux');
