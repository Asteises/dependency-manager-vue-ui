import { defineStore } from 'pinia';
import { ref } from 'vue';

export type NavStep = 'upload' | 'analyze' | 'result';

export const useUiStore = defineStore('ui', () => {
    const activeNav = ref<NavStep>('upload');
    function setActiveNav(step: NavStep) { activeNav.value = step; }
    return { activeNav, setActiveNav };
});
