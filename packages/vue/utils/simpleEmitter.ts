import type { IDisposable } from './disposable';

export interface EmitterEvent<T> {
  (listener: (e: T) => any, thisArgs?: any): IDisposable;
}

export class SimpleEmitter<T> {
  private _event?: EmitterEvent<T>;
  private _listeners: ((e: T) => any)[] = [];

  get event(): EmitterEvent<T> {
    this._event ??= (callback: (e: T) => any, thisArgs?: any) => {
      if (thisArgs) {
        callback = callback.bind(thisArgs);
      }

      this._listeners.push(callback);

      return {
        dispose: () => {
          const index = this._listeners.indexOf(callback);
          if (index > -1) this._listeners.splice(index, 1);
        },
      };
    };
    return this._event;
  }

  public dispose(): void {
    if (this._listeners.length > 0) {
      this._listeners.length = 0;
    }
  }

  public fire(event: T): void {
    this._listeners.forEach(l => l?.(event));
  }
}
