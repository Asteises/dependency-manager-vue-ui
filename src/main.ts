/**
 * Точка входа приложения.
 * - Подключаем Pinia.
 * - Регистрируем глобальные обработчики ошибок
 * - Подключаем глобальные стили (CSS-переменные, normalize и т.п.).
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/router.ts';

// Глобальные стили проекта (если используете)
import './assets/styles.css';

const app = createApp(App);

// Pinia как единый источник состояния
const pinia = createPinia();
app.use(pinia);
app.use(router);

// Глобальные обработчики (best practice — централизованное логирование)
app.config.errorHandler = (err, instance, info) => {
    // Здесь можно отправлять ошибку в Sentry/LogRocket и др.
    console.error('[VueError]', err, info, instance);
};
app.config.warnHandler = (msg, instance, trace) => {
    // Предупреждения полезно тоже собирать в dev, чтобы не пропускать деградации
    if (import.meta.env.DEV) {
        console.warn('[VueWarn]', msg, trace, instance);
    }
};

// Монтируем приложение
app.mount('#app');

// Пример: стабильная инициализация «фич‑флагов»/конфига из ENV (если нужно)
// if (import.meta.env.VITE_FEATURE_X === 'enabled') { /* ... */ }
