<template>
  <div class="page">
    <header class="toolbar">
      <div class="title-wrap">
        <h1 class="title">Найденные зависимости</h1>
        <span class="badge">{{ deps.length }}</span>
      </div>

      <div class="actions">
        <button class="btn ghost" :disabled="loading" @click="onRefresh">
          {{ loading ? 'Обновляю…' : 'Обновить все до последней версии' }}
        </button>
        <button class="btn primary" @click="onSave">Сохранить изменения</button>
      </div>
    </header>

    <section v-if="deps.length" class="list">
      <article
          v-for="d in deps"
          :key="d.id"
          class="card"
          :class="{
    edited: isEdited(d),
    outdated: versionRelation(d) === 'outdated',
    upToDate: versionRelation(d) === 'ok'
  }"
      >
        <div class="brand">
          <img v-if="d.icon" :src="d.icon" :alt="`${d.artifactId} icon`"/>
          <div v-else class="placeholder" :data-letter="initials(d)"></div>
        </div>

        <div class="info">
          <div class="line">
            <span class="label">artifactId</span>
            <span class="value strong">{{ d.artifactId }}</span>
          </div>
          <div class="line">
            <span class="label">groupId</span>
            <span class="value mono">{{ d.groupId }}</span>
          </div>

          <div class="meta">
            <!-- текущая -->
            <div class="pill" :class="statusClass(d, 'current')">
              <span class="label">текущая</span>
              <span class="value">{{ d.currentVersion }}</span>
            </div>
            <!-- последняя -->
            <div class="pill" :class="statusClass(d, 'latest')">
              <span class="label">последняя</span>
              <span class="value">{{ d.latestVersion }}</span>
            </div>
          </div>
        </div>

        <div class="versions">
          <label class="select-label">Выбрать версию</label>
          <select
              class="select"
              :class="{ edited: isEdited(d) }"
              :value="d.selectedVersion ?? d.currentVersion"
              @change="e => onSelect(d.id, (e.target as HTMLSelectElement).value)"
          >
            <template v-for="group in groupVersions(d.allVersions)" :key="group.key">
              <optgroup :label="group.label">
                <option v-for="v in group.items" :key="v" :value="v">
                  {{ v }}
                </option>
              </optgroup>
            </template>
          </select>
        </div>
      </article>
    </section>

    <p v-else class="empty">Зависимости не найдены.</p>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted} from 'vue';
import {type Dependency, useDependenciesStore} from '@/stores/dependencies';
import { useUiStore } from '@/stores/ui';

// Для демо иконок можно использовать твои ассеты
import mavenIcon from '@/assets/images/maven_icon.png';
import gradleIcon from '@/assets/images/gradle_icon.png';
import pythonIcon from '@/assets/images/python_icon.png';

const ui = useUiStore();
const store = useDependenciesStore();
const deps = computed(() => store.items);
const loading = computed(() => store.loading);

function initials(d: Dependency) {
  const a = (d.artifactId?.[0] ?? 'D').toUpperCase();
  const g = (d.groupId?.[0] ?? 'P').toUpperCase();
  return `${a}${g}`;
}

function onSelect(depId: string, version: string) {
  store.updateSelection(depId, version);
}

async function onRefresh() {
  await store.refreshAll();
  store.applyLatestToAll();
}

function onSave() {
  store.saveSelections();
  // здесь можно роутить дальше или показать тост
}

function attachIcons(list: Dependency[]): Dependency[] {
  return list.map(d => {
    let icon: string | undefined;
    if (d.manager === 'maven') icon = mavenIcon;
    else if (d.manager === 'gradle') icon = gradleIcon;
    else if (d.manager === 'python') icon = pythonIcon;
    return {...d, icon};
  });
}

// semver сравнение: -1 (a<b), 0 (==), 1 (a>b)
function cmp(a: string, b: string): number {
  const pa = a.split('.').map(n => parseInt(n, 10));
  const pb = b.split('.').map(n => parseInt(n, 10));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0, db = pb[i] ?? 0;
    if (da !== db) return da > db ? 1 : -1;
  }
  return 0;
}

function versionRelation(d: { currentVersion: string; latestVersion: string }) {
  const r = cmp(d.currentVersion, d.latestVersion);
  if (r < 0) return 'outdated';       // текущая ниже последней
  if (r === 0) return 'ok';           // совпадает
  return 'ahead';                     // текущая выше (редко)
}

function isEdited(d: { currentVersion: string; selectedVersion?: string }) {
  return (d.selectedVersion ?? d.currentVersion) !== d.currentVersion;
}

function statusClass(d: any, which: 'current' | 'latest') {
  const rel = versionRelation(d);
  if (which === 'current') {
    return {
      danger: rel === 'outdated',
      info: rel === 'ahead',
      ok: rel === 'ok',
    };
  } else {
    // последняя версия всегда зелёная, чтобы читалось как цель обновления
    return {success: true};
  }
}


// На входе страницы — если стор пуст, подложим демо-данные
onMounted(() => {
  ui.setActiveNav('analyze');
  if (!store.items.length) {
    store.setDependencies(attachIcons([
      {
        id: 'org.springframework.boot:spring-boot-starter-web',
        manager: 'maven',
        groupId: 'org.springframework.boot',
        artifactId: 'spring-boot-starter-web',
        currentVersion: '3.2.5',
        latestVersion: '3.2.7',
        allVersions: ['3.2.7', '3.2.6', '3.2.5', '3.1.10', '3.1.9', '2.7.18', '2.6.15'],
      },
      {
        id: 'com.fasterxml.jackson.core:jackson-databind',
        manager: 'gradle',
        groupId: 'com.fasterxml.jackson.core',
        artifactId: 'jackson-databind',
        currentVersion: '2.17.0',
        latestVersion: '2.17.2',
        allVersions: ['2.17.2', '2.17.1', '2.17.0', '2.16.2', '2.16.1', '2.15.4'],
      },
      {
        id: 'requests',
        manager: 'python',
        groupId: 'pypi',
        artifactId: 'requests',
        currentVersion: '2.31.0',
        latestVersion: '2.32.3',
        allVersions: ['2.32.3', '2.32.2', '2.31.0', '2.30.0', '2.29.0', '2.28.2'],
      },
    ]));
  }
});

/**
 * Группируем версии по «major.minor.x».
 * Пример: 3.2.7, 3.2.6, 3.2.5 → группа "3.2.x"
 */
function groupVersions(versions: string[]) {
  const buckets = new Map<string, string[]>();
  for (const v of versions) {
    const m = v.match(/^(\d+)\.(\d+)\./);
    const key = m ? `${m[1]}.${m[2]}.x` : 'прочее';
    const arr = buckets.get(key) ?? [];
    arr.push(v);
    buckets.set(key, arr);
  }
  // сортируем ключи по убыванию, внутри — по убыванию
  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => compareKeyDesc(a, b));
  return sortedKeys.map(k => ({
    key: k,
    label: k,
    items: (buckets.get(k) ?? []).sort(compareSemverDesc),
  }));
}

function compareKeyDesc(a: string, b: string) {
  const pa = a.split('.').map(x => (x === 'x' ? -1 : Number(x)));
  const pb = b.split('.').map(x => (x === 'x' ? -1 : Number(x)));
  // сравниваем major, minor (x всегда последним)
  return (pb[0] - pa[0]) || (pb[1] - pa[1]) || 0;
}

function compareSemverDesc(a: string, b: string) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  return (pb[0] - pa[0]) || (pb[1] - pa[1]) || (pb[2] - pa[2]);
}
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

/* сетка карточки: сузили правую колонку */
.card {
  display: grid;
  grid-template-columns: 72px 1fr auto; /* авто для компактного селекта */
  gap: 16px;
  align-items: center;
  padding: 14px;
  border: 1px solid #eef1ff;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(82, 93, 255, 0.06);
}

.card.edited {
  box-shadow: 0 4px 16px rgba(123, 108, 241, .12);
  border-color: #d8d2ff;
  background: linear-gradient(180deg, #fafbff, #ffffff);
}

.versions {
  width: 170px; /* раньше было ~280px, теперь около 50–60% */
  display: grid;
  gap: 6px;
}

.brand {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
}

.brand img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.placeholder {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #6e8efb22, #a777e322);
  color: #3f47a1;
  font-weight: 800;
  border: 1px dashed rgba(110, 142, 251, .45);
  position: relative;
}

.placeholder::after {
  content: attr(data-letter);
  position: absolute;
  font-size: 18px;
}

/* Данные */
.info .line {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 10px;
}

.label {
  color: #7680b7;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .03em;
}

.value {
  color: #222;
}

.value.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.value.strong {
  font-weight: 700;
}


.meta {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: #f5f7ff;
  border: 1px solid #e6e9ff;
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}

.pill .label {
  font-size: 11px;
  color: #6c76aa;
  text-transform: uppercase;
}

.pill .value {
  font-weight: 700;
}

.pill.danger {
  background: #fff5f5;
  border-color: #ffd6d6;
  color: #b71c1c;
}

.pill.success {
  background: #f4fff6;
  border-color: #c8f0d0;
  color: #176c3a;
}

.pill.info {
  background: #f0f8ff;
  border-color: #cfe5ff;
  color: #1e64b7;
}

.pill.highlight {
  border-color: #cfd6ff;
  background: linear-gradient(180deg, #f7f8ff, #ffffff);
}

/* Выбор версии */
.versions {
  display: grid;
  gap: 6px;
}

.select-label {
  font-size: 12px;
  color: #6c76aa;
}

.select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #dfe3ff;
  border-radius: 10px;
  background: #fff;
  outline: none;
  transition: border-color .15s ease, box-shadow .2s ease;
}

.select:focus {
  border-color: #9aa6ff;
  box-shadow: 0 0 0 3px rgba(110, 142, 251, .18);
}

.select.edited {
  border-color: #7b6cf1;
  box-shadow: 0 0 0 3px rgba(123, 108, 241, .18);
  background: linear-gradient(
      90deg,
      rgba(110, 142, 251, 0.15),
      rgba(167, 119, 227, 0.15)
  );
}

/* подсветка выбранной опции в выпадающем списке */
.select option:checked {
  background: linear-gradient(90deg, #6e8efb, #a777e3);
}

.empty {
  color: #6b7280;
  text-align: center;
  margin-top: 32px;
}

@media (max-width: 880px) {
  .card {
    grid-template-columns: 56px 1fr;
  }

  .versions {
    grid-column: 1 / -1;
    width: 100%;
  }
}
</style>
