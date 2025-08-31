<template>
  <header class="app-header">
    <div class="header-overlay"></div>
    <div class="header-container">
      <div class="badge">
        <svg
            class="badge-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
          <!-- Иконка: стрелка вверх + шестерёнка -->
          <path d="M12 19V5"></path>
          <path d="M5 12l7-7 7 7"></path>
        </svg>
        <span>Streamline Your Dependencies</span>
      </div>

      <h1 class="header-title">
        Dependency <br />
        Manager
      </h1>

      <p class="header-subtitle">
        Анализируйте, управляйте и экспортируйте с легкостью
<!--        Manage with clarity and confidence. Transform your dependency workflow-->
<!--        with intelligent analysis and seamless updates.-->
      </p>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, #f0f9ff, #ffffff);
  padding: 2rem 1rem;
}

.header-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 123, 255, 0.1), transparent);
  opacity: 0.1;
  z-index: 0;
}

.header-container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background-color: rgba(0, 123, 255, 0.1);
  color: #007bff;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 2rem;
}

.badge-icon {
  display: block;
}

/* Заголовок — безопасные межстрочные интервалы */
.header-title {
  /* масштабируемый размер */
  font-size: clamp(40px, 6vw, 66px);
  font-weight: 900;
  line-height: 1.3;        /* ↑ запас, чтобы хвосты букв не срезались */
  margin: 0 0 18px 0;       /* ↓ отступ от абзаца */
  letter-spacing: 0.2px;

  /* градиент по тексту */
  background: linear-gradient(90deg, #1e40af, #1363df 55%, #1e90ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;

  /* качество рендера */
  text-rendering: optimizeLegibility;
  font-feature-settings: "liga" 1, "kern" 1;
}

.header-subtitle {
  font-size: 1.25rem;
  color: #666666;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.5;
}
</style>
