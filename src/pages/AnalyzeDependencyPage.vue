<template>
  <div class="page">
    <header class="toolbar">
      <div class="title-wrap"><h1 class="title">Найденные зависимости</h1> <span class="badge">{{ deps.length }}</span>
      </div>
      <div class="actions">
        <button class="btn ghost" :disabled="loading" @click="onRefresh">
          {{ loading ? 'Обновляю…' : 'Обновить все до последней версии' }}
        </button>
        <button class="btn primary" @click="onSave">Сохранить изменения</button>
      </div>
    </header>
    <section v-if="deps.length" class="list">
      <DependencyCard
          v-for="d in deps"
          :key="d.id"
          :model="d"
          @select="({ id, version }) => onSelect(id, version)"
      />
    </section>
    <p v-else class="empty">Зависимости не найдены.</p>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted} from 'vue';
import {useDependenciesStore} from '@/stores/dependencies.store.ts';
import {useUiStore} from "@/stores/ui.store.ts";
import DependencyCard from "@/components/dependencies/DependencyCard.vue";
import router from "@/router/router.ts";

const depsStore = useDependenciesStore();
const deps = computed(() => depsStore.items);
const loading = computed(() => depsStore.loading);
const uiStore = useUiStore();

function onSelect(depId: string, version: string) {
  depsStore.updateSelection(depId, version);
}

async function onRefresh() {
  depsStore.applyLatestToAll();
}

function onSave() {
  depsStore.saveSelections();
  router.push('/export');
}

onMounted(() => {
  uiStore.setActiveNav('analyze');
});
</script>

<style scoped>
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  color: #222;
  font-family: 'Roboto', sans-serif;
}

/* Шапка */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(90deg, #6e8efb, #a777e3);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(110, 142, 251, .12);
  color: #3f47a1;
  font-weight: 700;
  border: 1px solid rgba(110, 142, 251, .35);
}

.actions {
  display: flex;
  gap: 10px;
}

.btn {
  border: none;
  cursor: pointer;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 700;
  transition: transform .15s ease, box-shadow .2s ease, opacity .2s ease;
}

.btn.ghost {
  background: #fff;
  color: #3f47a1;
  border: 1px solid rgba(110, 142, 251, .35);
}

.btn.ghost:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(82, 93, 255, .12);
}

.btn.ghost:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.btn.primary {
  background: linear-gradient(90deg, #6e8efb, #a777e3);
  color: #fff;
}

.btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(82, 93, 255, .25);
}

/* Список карточек */
.list {
  display: grid;
  gap: 12px;
}
</style>