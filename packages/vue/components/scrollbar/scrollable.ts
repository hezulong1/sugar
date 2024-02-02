export const enum ScrollbarVisibility {
  Auto = 1,
  Hidden = 2,
  Visible = 3,
}

export interface ScrollEvent {
  inSmoothScrolling: boolean;

  oldWidth: number;
  oldScrollWidth: number;
  oldScrollLeft: number;

  width: number;
  scrollWidth: number;
  scrollLeft: number;

  oldHeight: number;
  oldScrollHeight: number;
  oldScrollTop: number;

  height: number;
  scrollHeight: number;
  scrollTop: number;

  widthChanged: boolean;
  scrollWidthChanged: boolean;
  scrollLeftChanged: boolean;

  heightChanged: boolean;
  scrollHeightChanged: boolean;
  scrollTopChanged: boolean;
}

export interface IScrollDimensions {
  readonly width: number;
  readonly scrollWidth: number;
  readonly height: number;
  readonly scrollHeight: number;
}
export interface INewScrollDimensions {
  width?: number;
  scrollWidth?: number;
  height?: number;
  scrollHeight?: number;
}

export interface IScrollPosition {
  readonly scrollLeft: number;
  readonly scrollTop: number;
}
export interface ISmoothScrollPosition {
  readonly scrollLeft: number;
  readonly scrollTop: number;

  readonly width: number;
  readonly height: number;
}
export interface INewScrollPosition {
  scrollLeft?: number;
  scrollTop?: number;
}

export class ScrollState implements IScrollDimensions, IScrollPosition {
  _scrollStateBrand: void = undefined;

  public readonly rawScrollLeft: number;
  public readonly rawScrollTop: number;

  public readonly width: number;
  public readonly scrollWidth: number;
  public readonly scrollLeft: number;
  public readonly height: number;
  public readonly scrollHeight: number;
  public readonly scrollTop: number;

  constructor(
    private readonly _forceIntegerValues: boolean,
    width: number,
    scrollWidth: number,
    scrollLeft: number,
    height: number,
    scrollHeight: number,
    scrollTop: number,
  ) {
    if (this._forceIntegerValues) {
      width = width | 0;
      scrollWidth = scrollWidth | 0;
      scrollLeft = scrollLeft | 0;
      height = height | 0;
      scrollHeight = scrollHeight | 0;
      scrollTop = scrollTop | 0;
    }

    this.rawScrollLeft = scrollLeft; // before validation
    this.rawScrollTop = scrollTop; // before validation

    if (width < 0) {
      width = 0;
    }
    if (scrollLeft + width > scrollWidth) {
      scrollLeft = scrollWidth - width;
    }
    if (scrollLeft < 0) {
      scrollLeft = 0;
    }

    if (height < 0) {
      height = 0;
    }
    if (scrollTop + height > scrollHeight) {
      scrollTop = scrollHeight - height;
    }
    if (scrollTop < 0) {
      scrollTop = 0;
    }

    this.width = width;
    this.scrollWidth = scrollWidth;
    this.scrollLeft = scrollLeft;
    this.height = height;
    this.scrollHeight = scrollHeight;
    this.scrollTop = scrollTop;
  }

  public equals(other: ScrollState): boolean {
    return (
      this.rawScrollLeft === other.rawScrollLeft
      && this.rawScrollTop === other.rawScrollTop
      && this.width === other.width
      && this.scrollWidth === other.scrollWidth
      && this.scrollLeft === other.scrollLeft
      && this.height === other.height
      && this.scrollHeight === other.scrollHeight
      && this.scrollTop === other.scrollTop
    );
  }

  public withScrollDimensions(update: INewScrollDimensions, useRawScrollPositions: boolean): ScrollState {
    return new ScrollState(
      this._forceIntegerValues,
      (typeof update.width !== 'undefined' ? update.width : this.width),
      (typeof update.scrollWidth !== 'undefined' ? update.scrollWidth : this.scrollWidth),
      useRawScrollPositions ? this.rawScrollLeft : this.scrollLeft,
      (typeof update.height !== 'undefined' ? update.height : this.height),
      (typeof update.scrollHeight !== 'undefined' ? update.scrollHeight : this.scrollHeight),
      useRawScrollPositions ? this.rawScrollTop : this.scrollTop,
    );
  }

  public withScrollPosition(update: INewScrollPosition): ScrollState {
    return new ScrollState(
      this._forceIntegerValues,
      this.width,
      this.scrollWidth,
      (typeof update.scrollLeft !== 'undefined' ? update.scrollLeft : this.rawScrollLeft),
      this.height,
      this.scrollHeight,
      (typeof update.scrollTop !== 'undefined' ? update.scrollTop : this.rawScrollTop),
    );
  }

  public createScrollEvent(previous: ScrollState, inSmoothScrolling: boolean): ScrollEvent {
    const widthChanged = (this.width !== previous.width);
    const scrollWidthChanged = (this.scrollWidth !== previous.scrollWidth);
    const scrollLeftChanged = (this.scrollLeft !== previous.scrollLeft);

    const heightChanged = (this.height !== previous.height);
    const scrollHeightChanged = (this.scrollHeight !== previous.scrollHeight);
    const scrollTopChanged = (this.scrollTop !== previous.scrollTop);

    return {
      inSmoothScrolling,
      oldWidth: previous.width,
      oldScrollWidth: previous.scrollWidth,
      oldScrollLeft: previous.scrollLeft,

      width: this.width,
      scrollWidth: this.scrollWidth,
      scrollLeft: this.scrollLeft,

      oldHeight: previous.height,
      oldScrollHeight: previous.scrollHeight,
      oldScrollTop: previous.scrollTop,

      height: this.height,
      scrollHeight: this.scrollHeight,
      scrollTop: this.scrollTop,

      widthChanged,
      scrollWidthChanged,
      scrollLeftChanged,

      heightChanged,
      scrollHeightChanged,
      scrollTopChanged,
    };
  }
}

export class SmoothScrollingUpdate {
  public readonly scrollLeft: number;
  public readonly scrollTop: number;
  public readonly isDone: boolean;

  constructor(scrollLeft: number, scrollTop: number, isDone: boolean) {
    this.scrollLeft = scrollLeft;
    this.scrollTop = scrollTop;
    this.isDone = isDone;
  }
}

interface IAnimation {
  (completion: number): number;
}

function createEaseOutCubic(from: number, to: number): IAnimation {
  const delta = to - from;
  return function (completion: number): number {
    return from + delta * easeOutCubic(completion);
  };
}

function createComposed(a: IAnimation, b: IAnimation, cut: number): IAnimation {
  return function (completion: number): number {
    if (completion < cut) {
      return a(completion / cut);
    }
    return b((completion - cut) / (1 - cut));
  };
}

function easeInCubic(t: number) {
  return t ** 3;
}

function easeOutCubic(t: number) {
  return 1 - easeInCubic(1 - t);
}
