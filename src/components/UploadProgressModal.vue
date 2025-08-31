<template>
  <div v-if="modelValue" class="backdrop" @click.self="close" role="presentation">
    <div
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-label="`Загрузка файла ${fileName}`"
        ref="dialogEl"
        @keydown.esc.prevent="close"
    >
      <!-- Крестик -->
      <button class="close-circle" @click="close" aria-label="Закрыть окно">
        <svg viewBox="0 0 24 24" class="close-icon" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <header class="modal-header">
        <h3 class="brand-title">Загрузка файла</h3>
      </header>

      <section class="modal-body">
        <div class="meta-card">
          <div class="row">
            <div class="label">Файл</div>
            <div class="value">{{ fileName }}</div>
          </div>
          <div class="row">
            <div class="label">Начато</div>
            <div class="value">{{ startedAtText }}</div>
          </div>
          <div class="row">
            <div class="label">Окончено</div>
            <div class="value">{{ endedAtText }}</div>
          </div>
          <div class="row">
            <div class="label">Затрачено</div>
            <div class="value">{{ spentText }}</div>
          </div>
        </div>

        <!-- Круговой прогресс -->
        <div class="progress-wrapper" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100"
             role="progressbar">
          <svg class="progress" :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" aria-hidden="true">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#6e8efb"/>
                <stop offset="100%" stop-color="#a777e3"/>
              </linearGradient>
              <filter id="glow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#7b6cf1" flood-opacity=".45"/>
              </filter>
            </defs>

            <circle class="track" :cx="center" :cy="center" :r="radius" fill="none" stroke="#EEF2FF"
                    :stroke-width="stroke"/>
            <circle class="bar" :cx="center" :cy="center" :r="radius" fill="none" stroke="url(#grad)"
                    :stroke-width="stroke"
                    stroke-linecap="round" :stroke-dasharray="circumference" :stroke-dashoffset="dashOffset"
                    :transform="`rotate(-90 ${center} ${center})`" filter="url(#glow)"/>
          </svg>

          <div class="progress-center">
            <div class="percent">{{ progress }}</div>
          </div>
        </div>

        <p class="brand-subtitle status-text">
          {{ statusText }}
        </p>
      </section>

      <footer class="modal-footer">
        <button class="primary" :disabled="!done" @click="close">Готово</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import router from "@/router";

const props = withDefaults(defineProps<{
  modelValue: boolean;
  fileName: string;
  startedAt?: Date;
  simulate?: boolean;
  durationMs?: number;
  size?: number;
  stroke?: number;
}>(), {
  simulate: true,
  durationMs: 3000,
  size: 200,
  stroke: 14
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'completed', payload: { endedAt: Date; spentMs: number }): void;
}>();

const dialogEl = ref<HTMLDivElement | null>(null);
const progress = ref(0);
const startedAt = ref<Date>(props.startedAt ?? new Date());
const endedAt = ref<Date | null>(null);
const spentMs = ref(0);

const startedAtText = computed(() => startedAt.value.toLocaleString());
const endedAtText = computed(() => endedAt.value ? endedAt.value.toLocaleString() : '—');
const spentText = computed(() => endedAt.value ? `${Math.max(1, Math.round(spentMs.value / 1000))} сек.` : '—');

const size = props.size;
const stroke = props.stroke;
const center = size / 2;
const radius = center - stroke / 2;
const circumference = 2 * Math.PI * radius;

const dashOffset = computed(() => circumference * (1 - progress.value / 100));
const statusText = computed(() => (progress.value < 100 ? 'Загрузка…' : 'Завершено'));
const done = computed(() => progress.value >= 100);

let rafId: number | null = null;
let startTs = 0;

function startSimulation() {
  if (!props.simulate) return;
  progress.value = 0;
  endedAt.value = null;
  spentMs.value = 0;
  startedAt.value = props.startedAt ?? new Date();
  startTs = performance.now();

  const animate = (now: number) => {
    const elapsed = now - startTs;
    const pct = Math.min(100, Math.round((elapsed / props.durationMs) * 100));
    progress.value = pct;

    if (pct < 100) {
      rafId = requestAnimationFrame(animate);
    } else {
      endedAt.value = new Date();
      spentMs.value = endedAt.value.getTime() - startedAt.value.getTime();
      emit('completed', {endedAt: endedAt.value, spentMs: spentMs.value});
    }
  };

  rafId = requestAnimationFrame(animate);
}

function stopSimulation() {
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
}

function close() {
  stopSimulation();
  emit('update:modelValue', false);
  router.push('/analyze')
}

watch(() => props.modelValue, (open) => {
  if (open) {
    requestAnimationFrame(() => dialogEl.value?.focus());
    startSimulation();
  } else stopSimulation();
}, {immediate: true});

onMounted(() => {
  if (props.modelValue) startSimulation();
});
onUnmounted(stopSimulation);
</script>

<style scoped>

:root {
  --brand1: #6e8efb;
  --brand2: #a777e3;
  --ink: #111827;
  --muted: #6b7280;
}

/* Фон затемнения */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: grid;
  place-items: center;
  z-index: 50;
}

.modal {
  position: relative;
  width: min(720px, 94vw);
  background: #fff;
  color: var(--ink); /* <-- явный цвет */
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  outline: none;
  display: flex;
  flex-direction: column;
}

.close-circle {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  padding: 0;
  border: 2px solid transparent;
  cursor: pointer;
  background: radial-gradient(closest-side, #fff 70%, transparent 71%) padding-box,
  linear-gradient(135deg, var(--brand1), var(--brand2)) border-box;
  color: #4c52a3;
  display: grid;
  place-items: center;
  transition: transform .16s ease, box-shadow .2s ease;
}

.close-circle:hover {
  transform: translateY(-1px) scale(1.03);
  box-shadow: 0 6px 16px rgba(82, 93, 255, .25);
}

.close-icon {
  width: 18px;
  height: 18px;
}

.modal-header, .modal-footer {
  padding: 16px 20px;
  border-bottom: 1px solid #edf1f7;
}

.modal-footer {
  border-bottom: none;
  border-top: 1px solid #edf1f7;
  display: flex;
  justify-content: flex-end;
}

.brand-title {
  margin: 0;
  font-weight: 900;
  font-size: 20px;
  color: #3f47a1; /* fallback */
  background: linear-gradient(90deg, var(--brand1), var(--brand2));
  -webkit-background-clip: text;
  background-clip: text;
}

/* «Таблица» */
.modal-body {
  padding: 18px 20px 8px;
}

.meta-card {
  display: grid;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(180deg, #fafbff, #ffffff);
  border: 1px solid #eef1ff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(82, 93, 255, 0.06);
  margin-bottom: 12px;
  color: var(--ink); /* фикс белого */
}

.row {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  gap: 10px;
}

.label {
  color: #7680b7;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: .02em;
}

.value {
  color: var(--ink);
  font-weight: 500;
}

/* Прогресс */
.progress-wrapper {
  position: relative;
  width: 240px;
  height: 240px;
  margin: 12px auto 0;
}

.progress {
  display: block;
  margin: 0 auto;
}

.track {
  opacity: .7;
}

.bar {
  transition: stroke-dashoffset .12s linear;
}

/* Цифры без % — градиент с фолбэком */
.progress-center {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.percent {
  font-size: 44px;
  font-weight: 900;
  color: #3f47a1;
  background: linear-gradient(90deg, var(--brand1), var(--brand2));
  -webkit-background-clip: text;
  background-clip: text;
}

.status-text {
  margin: 10px 0 0;
  text-align: center;
  font-weight: 800;
  font-size: 18px;
  color: #3f47a1; /* fallback */
  background: linear-gradient(90deg, var(--brand1), var(--brand2));
  -webkit-background-clip: text;
  background-clip: text;
}

.modal-footer .primary {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background-image: linear-gradient(90deg, var(--brand1), var(--brand2));
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.02) inset;
  transition: transform .15s ease, box-shadow .2s ease, opacity .2s ease;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  color: #3f47a1; /* fallback */
}

.modal-footer .primary:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.modal-footer .primary:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(82, 93, 255, .25);
}
</style>
