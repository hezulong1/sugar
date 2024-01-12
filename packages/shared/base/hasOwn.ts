const _hasOwn = Object.prototype.hasOwnProperty;
export const hasOwn = (obj: object, key: PropertyKey): key is keyof typeof obj => _hasOwn.call(obj, key);
