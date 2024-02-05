import type { IDisposable } from './disposable';

let _scheduleAtNextAnimationFrame: (runner: () => void, priority?: number) => IDisposable;

class AnimationFrameQueueItem implements IDisposable {
  private _runner: () => void;
  public priority: number;
  private _canceled: boolean;

  constructor(runner: () => void, priority: number = 0) {
    this._runner = runner;
    this.priority = priority;
    this._canceled = false;
  }

  public dispose(): void {
    this._canceled = true;
  }

  public execute(): void {
    if (this._canceled) {
      return;
    }

    try {
      this._runner();
    } catch (e) {
      // onUnexpectedError(e)
    }
  }

  // Sort by priority (largest to lowest)
  public static sort(a: AnimationFrameQueueItem, b: AnimationFrameQueueItem): number {
    return b.priority - a.priority;
  }
}

(function () {
  /**
   * The runners scheduled at the next animation frame
   */
  let NEXT_QUEUE: AnimationFrameQueueItem[] = [];
  /**
   * The runners scheduled at the current animation frame
   */
  let CURRENT_QUEUE: AnimationFrameQueueItem[] | null = null;
  /**
   * A flag to keep track if the native requestAnimationFrame was already called
   */
  let animFrameRequested = false;

  const animationFrameRunner = () => {
    animFrameRequested = false;

    CURRENT_QUEUE = NEXT_QUEUE;
    NEXT_QUEUE = [];

    while (CURRENT_QUEUE.length > 0) {
      CURRENT_QUEUE.sort(AnimationFrameQueueItem.sort);
      const top = CURRENT_QUEUE.shift()!;
      top.execute();
    }
  };

  _scheduleAtNextAnimationFrame = (runner: () => void, priority: number = 0) => {
    const item = new AnimationFrameQueueItem(runner, priority);
    NEXT_QUEUE.push(item);

    if (!animFrameRequested) {
      animFrameRequested = true;
      requestAnimationFrame(animationFrameRunner);
    }

    return item;
  };
})();

export const scheduleAtNextAnimationFrame = _scheduleAtNextAnimationFrame;
