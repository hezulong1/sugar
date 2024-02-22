import { userAgent } from './platform';

export const isFirefox = /* @__PURE__ */ userAgent.includes('Firefox');
export const isChrome = /* @__PURE__ */ (userAgent.includes('Chrome'));
export const isSafari = /* @__PURE__ */ !isChrome && (userAgent.includes('Safari'));
