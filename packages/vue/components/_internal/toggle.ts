import type { Component, PropType } from 'vue-demi';
import { defineComponent, ref, h, computed } from 'vue-demi';
import { KeyCode } from '../../utils/keyboard';

export let ToggleImpl = defineComponent({
  props: {
    as: { type: [String, Object] as PropType<string | Component>, default: 'button' },
    disabled: { type: Boolean },
    openClass: { type: String },
    modelValue: { type: Boolean, default: void 0 },
    defaultChecked: { type: Boolean, default: void 0 },
  },

  emits: ['update:modelValue', 'change'],

  setup(props, context) {
    let internalChecked = ref(props.defaultChecked);
    let isControlled = computed(() => typeof props.modelValue !== 'undefined');
    let checked = computed(() => isControlled.value ? props.modelValue : internalChecked.value);
    let klass = computed(() => checked.value ? props.openClass : void 0);

    context.expose({
      toggle,
    });

    function toggle() {
      const current = !checked.value;

      if (!isControlled.value) internalChecked.value = current;

      context.emit('update:modelValue', current);
      context.emit('change', current);
    }

    function handleClick(event: MouseEvent) {
      if (props.disabled) return;
      event.preventDefault();
      toggle();
    }

    function handleKeyup(event: KeyboardEvent) {
      if (props.disabled) return;
      if (event.key === KeyCode.Space) {
        event.preventDefault();
        toggle();
      } else if (event.key === KeyCode.Enter) {
        toggle();
      }
    }

    function handleKeypress(event: KeyboardEvent) {
      event.preventDefault();
    }

    return () => h(
      props.as,
      {
        class: klass.value,
        onClick: handleClick,
        onKeyup: handleKeyup,
        onKeypress: handleKeypress,
      },
      context.slots['default']?.({ checked: Boolean(checked.value) }),
    );
  },
});
