import type { Component, ExtractPropTypes, PropType } from 'vue-demi';
import { defineComponent, ref, h, computed } from 'vue-demi';
import { Keys } from '../../keyboard';
import { UNDEFINED } from '../../const';

export const enum SugarToggleKind {
  Switch = 1,
  Button,
}

const SugarToggleProps = {
  as: { type: <PropType<string | Component>>[String, Object], default: 'button' },
  kind: { type: <PropType<SugarToggleKind>>Number, default: SugarToggleKind.Switch },
  modelValue: { type: Boolean, default: UNDEFINED },
  defaultValue: { type: Boolean, default: UNDEFINED },
};

export type SugarToggleProps = ExtractPropTypes<typeof SugarToggleProps>;
export let SugarToggle = defineComponent({
  name: 'SugarToggle',
  props: SugarToggleProps,
  setup(props, { emit, slots }) {
    let internalChecked = ref(props.defaultValue);
    let isControlled = computed(() => typeof props.modelValue !== 'undefined');
    let checked = computed(() => (isControlled.value ? props.modelValue : internalChecked.value));
    let klass = computed(() => {
      if (!checked.value) return;
      return props.kind === SugarToggleKind.Switch
        ? 'checked'
        : props.kind === SugarToggleKind.Button
          ? 'pressed'
          : UNDEFINED;
    });

    const toggle = () => {
      const nValue = !checked.value;
      if (!isControlled.value) {
        internalChecked.value = nValue;
      }

      emit('update:modelValue', nValue);
      emit('change', nValue);
    };

    function handleClick(event: MouseEvent) {
      event.preventDefault();
      toggle();
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === Keys.Space) {
        event.preventDefault();
        toggle();
      } else if (event.key === Keys.Enter) {
        toggle();
        // attemptSubmit(event.currentTarget as HTMLElement);
      }
    }

    // This is needed so that we can "cancel" the click event when we use the `Enter` key on a button.
    function handleKeyPress(event: KeyboardEvent) {
      event.preventDefault();
    }

    return () => h(
      props.as,
      {
        class: klass.value,
        onClick: handleClick,
        onKeyup: handleKeyUp,
        onKeypress: handleKeyPress,
      },
      slots['default']?.({ checked: Boolean(checked.value) }),
    );
  },
});
