import { h, defineComponent } from 'vue';

export default /*#__PURE__*/ defineComponent({
  name: 'SugarToggle',
  setup(props, ctx) {
    return () => h(
      'div',
      {
        'aria-label': 'toggle',
      },
    );
  },
});
