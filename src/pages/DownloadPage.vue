<template>
  <div class="upload-container">
    <h2 class="upload-title">Загрузите файл с зависимостями в любом из форматов</h2>
    <p class="upload-subtitle"></p>

    <div class="project-types">
      <!-- Maven -->
      <router-link to="/maven-download" class="project-card">
        <img src="../assets/images/maven_icon.png" alt="Maven" class="project-logo">
        <div class="project-info">
          <h3>Maven</h3>
          <p>pom.xml</p>
        </div>
      </router-link>

      <!-- Gradle -->
      <router-link to="/gradle-download" class="project-card">
        <img src="../assets/images/gradle_icon.png" alt="Gradle" class="project-logo">
        <div class="project-info">
          <h3>Gradle</h3>
          <p>build.gradle</p>
        </div>
      </router-link>

      <!-- Python -->
      <router-link to="/python-download" class="project-card">
        <img src="../assets/images/python_icon.png" alt="Python" class="project-logo">
        <div class="project-info">
          <h3>Python</h3>
          <p>requirements.txt</p>
        </div>
      </router-link>
    </div>

    <!-- Блок для перетаскивания файла -->
    <div
        class="dropzone"
        @dragover.prevent
        @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        :class="{ 'dropzone--active': isDragging }"
    >
      <input type="file" ref="fileInput" @change="handleFileSelect" hidden/>
      <div class="dropzone-content">
        <img src="@/assets/images/upload.svg" alt="Upload Dependency" class="dropzone-icon"/>
        <p class="dropzone-text">Перетащите файл сюда</p>
        <p class="dropzone-hint">или</p>
        <button class="upload-button" @click="triggerFileSelect">Выберите файл</button>
      </div>
    </div>

    <!-- модалка прогресса -->
    <UploadProgressModal
        v-model="showModal"
        :file-name="selectedFile?.name ?? ''"
        :started-at="startedAt ?? undefined"
        :simulate="true"
        :duration-ms="3000"
    />
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {type Dependency, type MvnDependencyDTO, type MvnDTO, useDependenciesStore} from '@/stores/dependencies';
import UploadProgressModal from "@/components/UploadProgressModal.vue";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// UI state
const isDragging = ref(false);
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const showModal = ref(false);
const startedAt = ref<Date | null>(null);

// router & store
const router = useRouter();
const depsStore = useDependenciesStore();

// ===== 1) Определение типа файла =====
type FileKind = 'maven' | 'gradle' | 'python' | 'unknown';

function detectFileKind(file: File): FileKind {
  const name = file.name.toLowerCase().trim();

  // точечные кейсы прежде общих
  if (name === 'pom.xml') return 'maven';
  if (name.endsWith('.gradle') || name.endsWith('.gradle.kts')) return 'gradle';
  if (name === 'requirements.txt') return 'python';

  // fallback’и (если пользователь переименовал файл странно)
  if (name.endsWith('.xml')) return 'maven';
  if (name.endsWith('.txt')) return 'python';

  return 'unknown';
}

const API = {
  maven: {
    full: `${API_BASE}/maven/dependencies/full-dependencies`, // возвращает MvnDTO
    deps: `${API_BASE}/maven/dependencies/pom-dependencies`,
    parent: `${API_BASE}/maven/dependencies/parent-dependency`,
  },

  // Для gradle/python задал заглушки — подставь свои пути на бэкенде
  gradle: {
    deps: `${API_BASE}/gradle/dependencies`,
  },
  python: {
    deps: `${API_BASE}/python/dependencies`,
  },
} as const;

// ===== 3) Загрузка файла (multipart/form-data) =====
async function uploadMultipart<T>(url: string, file: File, signal?: AbortSignal): Promise<T> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(url, {
    method: 'POST',
    body: form,
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || 'Upload failed'}`);
  }
  return await res.json() as Promise<T>;
}

// ===== 4) Типы ответов =====


// ===== 5) Маппинг DTO -> Dependency для Pinia =====
function mapMavenToDeps(dto: MvnDTO): Dependency[] {
  return (dto.dependencies ?? []).map(d => ({
    id: `${d.groupId}:${d.artifactId}`,
    manager: 'maven',
    groupId: d.groupId,
    artifactId: d.artifactId,
    currentVersion: d.version,
    latestVersion: d.version,      // при открытии анализа пока ставим текущее; позже кнопка «Обновить все» подтащит latest
    allVersions: [d.version],      // наполним после запроса к репозиторию (по желанию)
    selectedVersion: d.version,
    icon: '/src/assets/images/maven_icon.png',
  }));
}

function triggerFileSelect() {
  fileInput.value?.click();
}

function openModal() {
  startedAt.value = new Date();
  showModal.value = true;
}

async function processFile(file: File) {
  const kind = detectFileKind(file);
  if (kind === 'unknown') {
    alert('Неподдерживаемый файл. Ожидаем: pom.xml, build.gradle(.kts), requirements.txt');
    return;
  }

  openModal();

  try {
    // можно использовать AbortController, если нужен таймаут/отмена
    const ctrl = new AbortController();

    if (kind === 'maven') {
      // Твой основной сценарий — полный разбор
      const dto = await uploadMultipart<MvnDTO>(API.maven.full, file, ctrl.signal);
      console.log("MvnDTO: ", dto)
      depsStore.setDependencies(mapMavenToDeps(dto));
    } else if (kind === 'gradle') {
      // Заглушка: ожидание аналогичного DTO со списком зависимостей
      // Тип ответа предположительный: { dependencies: {groupId, artifactId, version}[] }
      const dto = await uploadMultipart<{ dependencies: MvnDependencyDTO[] }>(API.gradle.deps, file);
      depsStore.setDependencies(dto.dependencies.map(d => ({
        id: `${d.groupId}:${d.artifactId}`,
        manager: 'gradle',
        groupId: d.groupId,
        artifactId: d.artifactId,
        currentVersion: d.version,
        latestVersion: d.version,
        allVersions: [d.version],
        selectedVersion: d.version,
        icon: '/src/assets/images/gradle_icon.png',
      })));
    } else if (kind === 'python') {
      // Заглушка для requirements.txt
      // Ожидаем ответ вида: { dependencies: { groupId:'pypi', artifactId:'requests', version:'2.32.3' }[] }
      const dto = await uploadMultipart<{
        dependencies: Array<{ name: string; version: string }>
      }>(API.python.deps, file);
      depsStore.setDependencies(dto.dependencies.map(d => ({
        id: `pypi:${d.name}`,
        manager: 'python',
        groupId: 'pypi',
        artifactId: d.name,
        currentVersion: d.version,
        latestVersion: d.version,
        allVersions: [d.version],
        selectedVersion: d.version,
        icon: '/src/assets/images/python_icon.png',
      })));
    }

    // по завершению — переходим к анализу
    await router.push('/analyze'); // имя/путь — как в твоём роутере
  } catch (e: any) {
    console.error(e);
    alert(`Ошибка загрузки: ${e.message ?? e}`);
  } finally {
    // модалка у тебя закрывается кнопкой "Готово", оставим как есть
    // если нужно закрывать автоматически — раскомментируй следующую строку:
    // showModal.value = false;
  }
}

// ===== 7) Handlers input/drag =====
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) processFile(file);
  target.value = ''; // чтобы можно было выбрать тот же файл заново
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) processFile(file);
}
</script>

<style scoped>

.dropzone-icon {
  max-width: 60px;
  transition: transform .3s ease;
}

.dropzone:hover .dropzone-icon {
  transform: translateY(-5px) scale(1.05);
}

/* Общие стили (согласованные с AppHeader и AppNav) */
.upload-container {
  font-family: 'Roboto', sans-serif; /* Используем тот же шрифт, что и в AppHeader */
  max-width: 900px;
  margin: 0 auto;
  padding: 10px;
  color: #333;
}

.upload-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #2c3e50;
}

.upload-subtitle {
  font-size: 16px;
  color: #7f8c8d;
  margin-bottom: 30px;
}

/* Стили для карточек проектов */
.project-types {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.project-card {
  background: white;
  border-radius: 12px;
  padding: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  cursor: pointer;
  text-align: center;
  border: 1px solid #e0e0e0;

  display: block; /* чтобы карточка вела себя как блок */
  text-decoration: none; /* <— убрать подчёркивание */
  color: inherit; /* <— цвет текста как у контейнера */
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.project-logo {
  max-height: 100px;
  width: auto;
  object-fit: contain;
}

.project-info h3 {
  font-size: 18px;
  margin-bottom: 5px;
  margin-top: 1px;
  color: #2c3e50;
}

.project-info p {
  font-size: 14px;
  margin-top: 1px;
  color: #7f8c8d;
}

/* Стили для зоны перетаскивания */
.dropzone {
  border: 2px dashed #bdc3c7;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.dropzone:hover {
  border-color: #3498db;
  background-color: #f0f7ff;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.dropzone-icon {
  max-width: 60px;
  transition: transform 0.3s ease;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.dropzone:hover .dropzone-icon {
  animation: bounce 0.6s ease-in-out infinite;
}

.dropzone i {
  font-size: 48px;
  color: #3498db;
}

.dropzone p {
  font-size: 16px;
  margin: 0;
}

.dropzone-hint {
  color: #7f8c8d;
  font-size: 14px;
}

.upload-button {
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>
