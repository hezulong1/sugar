import type { InjectionKey } from 'vue-demi';

export interface ScrollbarHost {

}

export const scrollbarHostKey: InjectionKey<ScrollbarHost> = Symbol('scrollbarHost');
