import { defineComponent, h, inject, ref } from 'vue';
import { getDomNodePagePosition } from '../../utils/dom';
import { scrollbarHostKey } from './constant';

export let ScrollbarImpl = defineComponent({
  props: {
    lazyRender: Boolean,
    scrollByPage: Boolean,
    vertical: Boolean,
    arrow: Boolean,
  },

  setup(props) {
    const root = ref<HTMLElement>();
    const scrollbarHost = inject(scrollbarHostKey);

    function handlePointerDown(e: PointerEvent) {
      if (!(root.value instanceof HTMLElement)) return;
      if (e.target !== root.value) return;

      let offsetX: number;
      let offsetY: number;

      if (typeof e.offsetX === 'number' && typeof e.offsetY === 'number') {
        offsetX = e.offsetX;
        offsetY = e.offsetY;
      } else {
        const domNodePosition = getDomNodePagePosition(root.value);
        offsetX = e.pageX - domNodePosition.left;
        offsetY = e.pageY - domNodePosition.top;
      }

      const offset = props.vertical ? offsetY : offsetX;
    }

    return () => h(
      'div',
      {
        ref: root,
        role: 'presentation',
        'aria-hidden': 'true',
        style: 'position: absolute',
        onPointerdown: handlePointerDown,
      },
    );
  },
});
