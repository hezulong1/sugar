import { toValue, useTimeoutFn } from '@vueuse/core';
import { type MaybeRefOrGetter, computed, readonly, ref, watch } from 'vue-demi';
import { ScrollbarVisibility } from './scrollable';

export function useScrollbarVisibilityController(
  visibility: MaybeRefOrGetter<ScrollbarVisibility>,
  visibleClassName: MaybeRefOrGetter<string>,
  invisibleClassName: MaybeRefOrGetter<string>,
) {
  let _isNeeded = false;

  const isVisible = ref(false);
  const shouldBeVisible = ref(false);
  const rawShouldBeVisible = ref(false);

  const visibilitySetting = computed(() => {
    const visibilityValue = toValue(visibility);
    if (visibilityValue === ScrollbarVisibility.Hidden) return false;
    if (visibilityValue === ScrollbarVisibility.Visible) return true;
    return rawShouldBeVisible.value;
  });

  const className = ref(toValue(invisibleClassName));
  const revealTimer = useTimeoutFn(() => (className.value = toValue(visibleClassName)), 0, { immediate: false });

  function _reveal() {
    if (isVisible.value) return;

    isVisible.value = true;
    // The CSS animation doesn't play otherwise
    revealTimer.start();
  }

  function _hide(withFadeAway: boolean) {
    revealTimer.stop();
    if (!isVisible.value) return;

    isVisible.value = false;
    className.value = toValue(invisibleClassName) + (withFadeAway ? ' fade' : '');
  }

  function _ensureVisibility() {
    if (!_isNeeded) {
      _hide(false);
      return;
    }

    if (shouldBeVisible.value) {
      _reveal();
    } else {
      _hide(true);
    }
  }

  function _updateShouldBeVisible() {
    if (shouldBeVisible.value !== visibilitySetting.value) {
      shouldBeVisible.value = visibilitySetting.value;
      _ensureVisibility();
    }
  }

  watch(() => toValue(visibility), _updateShouldBeVisible);

  function setIsNeeded(isNeeded: boolean) {
    if (_isNeeded !== isNeeded) {
      _isNeeded = isNeeded;
      _ensureVisibility();
    }
  }

  function setShouldBeVisible(visible: boolean) {
    if (rawShouldBeVisible.value !== visible) {
      rawShouldBeVisible.value = visible;
      _updateShouldBeVisible();
    }
  }

  return {
    isVisible: readonly(isVisible),
    className: readonly(className),
    setShouldBeVisible,
    setIsNeeded,
  };
}
