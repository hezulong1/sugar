import { type IDisposable } from './disposable';

export class TimeoutTimer implements IDisposable {
  private _token: number = -1;

  constructor();
  constructor(runner: VoidFunction, timeout: number);
  constructor(runner?: VoidFunction, timeout?: number) {
    if (typeof runner === 'function' && typeof timeout === 'number') {
      this.setIfNotSet(runner, timeout);
    }
  }

  dispose(): void {
    this.cancel();
  }

  cancel(): void {
    if (this._token !== -1) {
      clearTimeout(this._token);
      this._token = -1;
    }
  }

  cancelAndSet(runner: VoidFunction, timeout: number): void {
    this.cancel();
    this._token = setTimeout(() => {
      this._token = -1;
      runner();
    }, timeout);
  }

  setIfNotSet(runner: VoidFunction, timeout: number): void {
    if (this._token !== -1) {
      // timer is already set
      return;
    }
    this._token = setTimeout(() => {
      this._token = -1;
      runner();
    }, timeout);
  }
}

export class IntervalTimer implements IDisposable {
  private _token: number = -1;

  dispose(): void {
    this.cancel();
  }

  cancel(): void {
    if (this._token !== -1) {
      clearInterval(this._token);
      this._token = -1;
    }
  }

  cancelAndSet(runner: VoidFunction, interval: number): void {
    this.cancel();
    this._token = setInterval(() => {
      runner();
    }, interval);
  }
}
