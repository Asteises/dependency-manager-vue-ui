<template>
  <div class="export-page">
    <div class="container">
      <h1 class="title">Готово! Изменения применены</h1>

      <div class="stats-card">
        <div class="stat-item">
          <span class="stat-value">{{ totalDeps }}</span>
          <span class="stat-label">всего зависимостей</span>
        </div>
        <div class="stat-item">
          <span class="stat-value changed">{{ changedCount }}</span>
          <span class="stat-label">обновлено</span>
        </div>
      </div>

      <div v-if="changedCount > 0" class="changes-section">
        <h2>Обновлённые зависимости</h2>
        <div class="change-list">
          <div
              v-for="dep in changedDeps"
              :key="dep.id"
              class="change-item"
          >
            <div class="dep-info">
              <strong>{{ dep.groupId }}:{{ dep.artifactId }}</strong>
              <span class="scope" v-if="dep.scope">({{ dep.scope }})</span>
            </div>
            <div class="versions">
              <span class="old">{{ dep.currentVersion }}</span>
              <span class="arrow">→</span>
              <span class="new">{{ dep.selectedVersion }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button
            class="btn primary"
            @click="downloadFile"
            :disabled="downloading"
        >
          {{ downloading ? 'Генерация...' : 'Скачать pom.xml' }}
        </button>
        <router-link to="/analyze" class="btn outline">Назад к анализу</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import { useDependenciesStore } from '@/stores/dependencies.store';
import { downloadBlob } from '@/utils/file.utils';

const totalDeps = computed(() => depsStore.items.length);
const changedDeps = computed(() => depsStore.changedDependencies);
const changedCount = computed(() => changedDeps.value.length);

const depsStore = useDependenciesStore();
const downloading = ref(false);

async function downloadFile() {
  const user = localStorage.getItem('dm_user') || 'guest';
  if (!user) {
    alert('Пользователь не определён');
    return;
  }

  downloading.value = true;
  try {
    console.log('[ExportPage] Запрос на beautifier-pom для пользователя:', user);

    const pom = await depsStore.exportPomFile(user); // ← ДОБАВЬ `await`!

    if (!pom) {
      alert('Не удалось получить содержимое pom.xml');
      return;
    }

    const blob = new Blob([pom], { type: 'application/xml' });
    downloadBlob(blob, 'pom.xml');

  } catch (e: any) {
    console.error('[ExportPage] Ошибка скачивания:', e);
    alert(`Не удалось скачать файл: ${e.message}`);
  } finally {
    downloading.value = false;
  }
}
</script>

<style scoped>
.export-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.title {
  text-align: center;
  margin-bottom: 2rem;
  color: #2d3748;
}

.stats-card {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #4a5568;
}

.stat-value.changed {
  color: #48bb78;
}

.stat-label {
  display: block;
  color: #718096;
  font-size: 0.9rem;
}

.changes-section {
  margin: 2rem 0;
}

.change-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.change-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #edf2f7;
}

.change-item:last-child {
  border-bottom: none;
}

.dep-info {
  font-family: monospace;
  font-size: 0.95rem;
}

.scope {
  color: #a0aec0;
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

.versions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: monospace;
}

.old {
  color: #e53e3e;
  text-decoration: line-through;
}

.arrow {
  color: #718096;
}

.new {
  color: #38a169;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn.primary {
  background: #4299e1;
  color: white;
  border: none;
}

.btn.primary:hover:not(:disabled) {
  background: #3182ce;
}

.btn.primary:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.btn.outline {
  background: transparent;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn.outline:hover {
  background: #f7fafc;
}
</style>