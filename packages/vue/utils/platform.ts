let _isWindows = false;
let _isMacintosh = false;
let _isLinux = false;
let _isWeb = false;
let _userAgent: string = 'unknown';

if (typeof navigator === 'object') {
  _userAgent = navigator.userAgent;
  _isWindows = _userAgent.includes('Windows');
  _isMacintosh = _userAgent.includes('Macintosh');
  _isLinux = _userAgent.includes('Linux');
  _isWeb = true;
}

export const enum Platform {
  Web,
  Mac,
  Linux,
  Windows,
}

let _platform: Platform = Platform.Web;
if (_isMacintosh) {
  _platform = Platform.Mac;
} else if (_isWindows) {
  _platform = Platform.Windows;
} else if (_isLinux) {
  _platform = Platform.Linux;
}

export const userAgent = _userAgent;
export const platform = _platform;
export const isWindows = _isWindows;
export const isMacintosh = _isMacintosh;
export const isLinux = _isLinux;
export const isWeb = _isWeb;
