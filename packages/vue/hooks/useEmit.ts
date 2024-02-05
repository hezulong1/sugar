import { getCurrentInstance } from 'vue-demi';

export function useEmit() {
  const vm = getCurrentInstance();
  if (!vm) return;
  // @ts-expect-error @vue/composition-api
  return vm.emit || vm.$emit?.bind(vm) || vm.proxy?.$emit?.bind(vm.proxy);
}
