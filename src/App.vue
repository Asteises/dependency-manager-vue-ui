<template>
  <div class="app">
    <AppHeader/>
    <AppNav/>
    <RouterView/>
  </div>
</template>

<script setup lang="ts">
import AppHeader from './components/AppHeader.vue';
import AppNav from './components/AppNav.vue';
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
