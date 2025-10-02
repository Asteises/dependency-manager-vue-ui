<template>
  <article
      class="card"
      :class="{
      edited: isEdited,
      outdated: relation === 'outdated',
      upToDate: relation === 'ok'
    }"
  >
    <div class="brand">
      <img v-if="model.icon" :src="model.icon" :alt="`${model.artifactId} icon`" />
      <div v-else class="placeholder" :data-letter="initials(model)"></div>
    </div>

    <div class="info">
      <div class="line">
        <span class="label">artifactId</span>
        <span class="value strong">{{ model.artifactId }}</span>
      </div>
      <div class="line">
        <span class="label">groupId</span>
        <span class="value mono">{{ model.groupId }}</span>
      </div>

      <div class="meta">
        <div class="pill" :class="statusClass('current')">
          <span class="label">текущая</span>
          <span class="value">{{ model.currentVersion }}</span>
        </div>
        <div class="pill" :class="statusClass('latest')">
          <span class="label">последняя</span>
          <span class="value">{{ model.latestVersion }}</span>
        </div>
      </div>
    </div>

    <div class="versions">
      <label class="select-label">Выбрать версию</label>
      <select
          class="select"
          :class="{ edited: isEdited }"
          :value="selected"
          @change="onSelect(($event.target as HTMLSelectElement).value)"
      >
        <template v-for="group in grouped" :key="group.key">
          <optgroup :label="group.label">
            <option v-for="v in group.items" :key="v" :value="v">{{ v }}</option>
          </optgroup>
        </template>
      </select>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Dependency } from '@/types/maven-types';
import { useVersions } from '@/composables/use-versions';
import { initials as initialsFn } from '@/composables/use-dependency-ui';

const props = defineProps<{
  model: Dependency;
}>();

const emit = defineEmits<{
  (e: 'select', payload: { id: string; version: string }): void;
}>();

const { versionRelation, groupVersions } = useVersions();

const relation = computed(() => versionRelation({
  currentVersion: props.model.currentVersion,
  latestVersion: props.model.latestVersion
}));

const selected = computed(() => props.model.selectedVersion ?? props.model.currentVersion);
const isEdited = computed(() => selected.value !== props.model.currentVersion);
const grouped = computed(() => groupVersions(props.model.allVersions));

function onSelect(version: string) {
  emit('select', { id: props.model.id, version });
}

function statusClass(which: 'current' | 'latest') {
  if (which === 'current') {
    return {
      danger: relation.value === 'outdated',
      info: relation.value === 'ahead',
      ok: relation.value === 'ok',
    };
  }
  return { success: true };
}

function initials(d: Dependency) {
  return initialsFn(d);
}
</script>

<style scoped>
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
