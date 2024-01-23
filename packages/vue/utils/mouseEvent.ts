export interface IMouseWheelEvent extends MouseEvent {
  readonly wheelDelta: number;
  readonly wheelDeltaX: number;
  readonly wheelDeltaY: number;

  readonly deltaX: number;
  readonly deltaY: number;
  readonly deltaZ: number;
  readonly deltaMode: number;
}
