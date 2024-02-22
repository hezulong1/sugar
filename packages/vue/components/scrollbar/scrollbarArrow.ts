/**
 * The arrow image size.
 */
export const ARROW_IMG_SIZE = 11;

export interface ScrollbarArrowOptions {
  bgWidth: number;
  bgHeight: number;

  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

export interface ScrollbarArrowEmits {
  (e: 'activate'): void;
}
