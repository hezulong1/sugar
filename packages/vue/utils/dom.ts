// import { type IDisposable } from './disposable';
// import { type IMouseEvent, StandardMouseEvent } from './mouseEvent';
// import { type IKeyboardEvent, StandardKeyboardEvent } from './keyboardEvent';

// export const EventType = {
//   // Mouse
//   CLICK: 'click',
//   AUXCLICK: 'auxclick',
//   DBLCLICK: 'dblclick',
//   MOUSE_UP: 'mouseup',
//   MOUSE_DOWN: 'mousedown',
//   MOUSE_OVER: 'mouseover',
//   MOUSE_MOVE: 'mousemove',
//   MOUSE_OUT: 'mouseout',
//   MOUSE_ENTER: 'mouseenter',
//   MOUSE_LEAVE: 'mouseleave',
//   MOUSE_WHEEL: 'wheel',
//   POINTER_UP: 'pointerup',
//   POINTER_DOWN: 'pointerdown',
//   POINTER_MOVE: 'pointermove',
//   POINTER_LEAVE: 'pointerleave',
//   CONTEXT_MENU: 'contextmenu',
//   WHEEL: 'wheel',
//   // Keyboard
//   KEY_DOWN: 'keydown',
//   KEY_PRESS: 'keypress',
//   KEY_UP: 'keyup',
//   // Drag
//   DRAG_START: 'dragstart',
//   DRAG: 'drag',
//   DRAG_ENTER: 'dragenter',
//   DRAG_LEAVE: 'dragleave',
//   DRAG_OVER: 'dragover',
//   DROP: 'drop',
//   DRAG_END: 'dragend',
// } as const;

// export function addDisposableListener<K extends keyof GlobalEventHandlersEventMap>(node: EventTarget, type: K, handler: (event: GlobalEventHandlersEventMap[K]) => void, useCapture?: boolean): IDisposable;
// export function addDisposableListener(node: EventTarget, type: string, handler: (event: any) => void, useCapture?: boolean): IDisposable;
// export function addDisposableListener(node: EventTarget, type: string, handler: (event: any) => void, options: AddEventListenerOptions): IDisposable;
// export function addDisposableListener(node: EventTarget, type: string, handler: (event: any) => void, useCaptureOrOptions?: boolean | AddEventListenerOptions): IDisposable {
//   const _options = useCaptureOrOptions || false;
//   const dispose = () => {
//     if (!handler) return;
//     node.removeEventListener(type, handler, _options);
//     node = null!;
//     handler = null!;
//   };
//   node.addEventListener(type, handler, _options);
//   return { dispose };
// }

// export interface IAddStandardDisposableListenerSignature {
//   (node: HTMLElement, type: 'click', handler: (event: IMouseEvent) => void, useCapture?: boolean): IDisposable;
//   (node: HTMLElement, type: 'mousedown', handler: (event: IMouseEvent) => void, useCapture?: boolean): IDisposable;
//   (node: HTMLElement, type: 'keydown', handler: (event: IKeyboardEvent) => void, useCapture?: boolean): IDisposable;
//   (node: HTMLElement, type: 'keypress', handler: (event: IKeyboardEvent) => void, useCapture?: boolean): IDisposable;
//   (node: HTMLElement, type: 'keyup', handler: (event: IKeyboardEvent) => void, useCapture?: boolean): IDisposable;
//   (node: HTMLElement, type: 'pointerdown', handler: (event: PointerEvent) => void, useCapture?: boolean): IDisposable;
//   (node: HTMLElement, type: 'pointermove', handler: (event: PointerEvent) => void, useCapture?: boolean): IDisposable;
//   (node: HTMLElement, type: 'pointerup', handler: (event: PointerEvent) => void, useCapture?: boolean): IDisposable;
//   (node: HTMLElement, type: string, handler: (event: any) => void, useCapture?: boolean): IDisposable;
// }
// function _wrapAsStandardMouseEvent(handler: (e: IMouseEvent) => void): (e: MouseEvent) => void {
//   return function (e: MouseEvent) {
//     return handler(new StandardMouseEvent(e));
//   };
// }
// function _wrapAsStandardKeyboardEvent(handler: (e: IKeyboardEvent) => void): (e: KeyboardEvent) => void {
//   return function (e: KeyboardEvent) {
//     return handler(new StandardKeyboardEvent(e));
//   };
// }
// export const addStandardDisposableListener: IAddStandardDisposableListenerSignature = function addStandardDisposableListener(node: HTMLElement, type: string, handler: (event: any) => void, useCapture?: boolean): IDisposable {
//   let wrapHandler = handler;

//   if (type === 'click' || type === 'mousedown') {
//     wrapHandler = _wrapAsStandardMouseEvent(handler);
//   } else if (type === 'keydown' || type === 'keypress' || type === 'keyup') {
//     wrapHandler = _wrapAsStandardKeyboardEvent(handler);
//   }

//   return addDisposableListener(node, type, wrapHandler, useCapture);
// };

export interface IDomNodePagePosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Returns the position of a dom node relative to the entire page.
 */
export function getDomNodePagePosition(domNode: HTMLElement): IDomNodePagePosition {
  const bb = domNode.getBoundingClientRect();
  return {
    left: bb.left + (domNode.ownerDocument.defaultView?.scrollX ?? 0),
    top: bb.top + (domNode.ownerDocument.defaultView?.scrollY ?? 0),
    width: bb.width,
    height: bb.height,
  };
}

export function getWindow(element: Node): Window & typeof globalThis;
export function getWindow(event: UIEvent): Window & typeof globalThis;
export function getWindow(obj: unknown): Window & typeof globalThis;
export function getWindow(e: unknown): Window & typeof globalThis {
  const candidateNode = e as Node | undefined;
  if (candidateNode?.ownerDocument?.defaultView) {
    return candidateNode.ownerDocument.defaultView.window;
  }

  const candidateEvent = e as UIEvent | undefined;
  if (candidateEvent?.view) {
    return candidateEvent.view.window;
  }

  return window;
}
