<template>
  <div class="navigation">
    <div class="nav-item" :class="{ active: ui.activeNav === 'upload' }">
      <div class="nav-icon">📁</div>
      <div class="nav-text">Загрузка</div>
    </div>
    <div class="nav-item" :class="{ active: ui.activeNav === 'analyze' }">
      <div class="nav-icon">🔍</div>
      <div class="nav-text">Анализ</div>
    </div>
    <div class="nav-item" :class="{ active: ui.activeNav === 'result' }">
      <div class="nav-icon">📤</div>
      <div class="nav-text">Экспорт</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui.store.ts';

const ui = useUiStore();
</script>

<style scoped>
.navigation {
  display: flex;
  justify-content: center; /* Центрирование на экране */
  gap: 20px;
  padding: 5px;
  background-color: #f5f7fa;
  border-radius: 10px;
  margin: 10px auto;
  max-width: 800px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-item.active {
  background: linear-gradient(135deg, #6e8efb, #a777e3); /* Градиент для текущего шага */
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.nav-item.active::after {
  content: "";
  display: block;
  width: 50%;
  height: 2px;
  background: white;
  margin-top: 5px;
}

.nav-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.nav-text {
  font-weight: 500;
}
</style>
