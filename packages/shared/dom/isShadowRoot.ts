export function isShadowRoot(node: Node): node is ShadowRoot {
  return node && Boolean((<ShadowRoot>node).host) && Boolean((<ShadowRoot>node).mode);
}
