export function getActiveElement() {
  let activeElement = document.activeElement;
  while (activeElement?.shadowRoot) {
    activeElement = activeElement.shadowRoot.activeElement;
  }
  return activeElement;
}
