export function getWindow(node: Node | undefined | null): Window {
  if (node?.ownerDocument?.defaultView) {
    return node.ownerDocument.defaultView.window;
  }
  return window;
}
