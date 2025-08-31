import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'DownloadHome',
        component: () => import('../pages/DownloadPage.vue'),
        meta: { title: 'Загрузка зависимостей' },
    },
    {
        path: '/maven-download',
        name: 'MavenDownload',
        component: () => import('../pages/MavenDownloadPage.vue'),
        meta: { title: 'Загрузите файл MAVEN' },
    },
    {
        path: '/gradle-download',
        name: 'GradleDownload',
        component: () => import('../pages/GradleDownloadPage.vue'),
        meta: { title: 'Загрузите файл GRADLE' },
    },
    {
        path: '/python-download',
        name: 'PythonDownload',
        component: () => import('../pages/PythonDownloadPage.vue'),
        meta: { title: 'Загрузите файл PYTHON' },
    },
    {
        path: '/analyze',
        name: 'AnalyzeDependency',
        component: () => import('../pages/AnalyzeDependencyPage.vue'),
        meta: { title: 'Анализируйте и управляйте зависимостями' },
    },
    // fallback на главную (или можешь сделать 404 страницу)
    {
        path: '/:pathMatch(.*)*',
        redirect: { name: 'DownloadHome' },
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    // скролл вверх при смене страниц — UX best practice
    scrollBehavior() {
        return { top: 0 };
    },
});

// динамически меняем document.title (по желанию)
router.afterEach((to) => {
    if (to.meta?.title) {
        document.title = String(to.meta.title);
    }
});

export default router;
