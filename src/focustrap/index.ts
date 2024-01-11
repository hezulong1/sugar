import { defineComponent, Fragment, h, ref } from 'vue-demi';

export default defineComponent({
  name: 'SugarFocustrap',
  setup(props) {
    const focusStartRef = ref<HTMLElement>();
    const focusEndRef = ref<HTMLElement>();
    return {
      focusStartRef,
      focusEndRef,
    };
  },
  render() {
    return h(
      Fragment,
      {},
      [
        h('div', { ref: 'focusStartRef' }),
        this.$slots['default']?.(),
        h('div', { ref: 'focusEndRef' }),
      ],
    );
  },
});
