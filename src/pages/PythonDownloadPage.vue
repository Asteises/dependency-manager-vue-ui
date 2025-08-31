<template>
  <div class="upload-container">
    <h2 class="upload-title">Загрузите файл requirements.txt</h2>
    <p class="upload-subtitle"></p>

    <!-- Блок для перетаскивания файла -->
    <div
        class="dropzone"
        @dragover.prevent
        @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        :class="{ 'dropzone--active': isDragging }"
    >
      <input type="file" ref="fileInput" @change="handleFileSelect" hidden />
      <div class="dropzone-content">
        <img src="@/assets/images/python-upload.svg" alt="Upload Python Dependency" class="dropzone-icon" />
        <p class="dropzone-text">Перетащите файл requirements.txt сюда</p>
        <p class="dropzone-hint">или</p>
        <button class="upload-button" @click="triggerFileSelect">Выберите файл</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isDragging = ref(false);
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

function triggerFileSelect() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    selectedFile.value = event.dataTransfer.files[0];
  }
}
</script>

<style scoped>

.upload-container {
  font-family: 'Roboto', sans-serif;
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
  max-width: 90px;
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
