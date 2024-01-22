export const passive = /* @__PURE__ */(() => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  let passive = false;
  try {
    const get = function () {
      passive = true;
    };
    const opts = Object.defineProperty({}, 'passive', { get });
    window.addEventListener('test', () => { /* noop */ }, opts);
  } catch (e) {
    /* nothing */
  }
  return passive;
})();
