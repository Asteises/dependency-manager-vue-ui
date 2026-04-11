import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import MainLayout from '@/layout/MainLayout.vue'
import AuthLayout from '@/layout/AuthLayout.vue'

const routes: RouteRecordRaw[] = [
    // AUTH (гостевой лэйаут)
    {
        path: '/auth',
        component: AuthLayout,
        children: [
            {
                path: '',
                name: 'auth',
                component: () => import('@/pages/AuthPage.vue'),
                meta: {
                    title: 'Dependency Manager — вход',
                    guestOnly: true,
                },
            },
        ],
    },
    // APP (основной лэйаут + защита)
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },  // всё внутри — только для авторизованных
        children: [
            {
                path: '',
                name: 'home',
                component: () => import('@/pages/DownloadPage.vue'),
                meta: { title: 'Загрузка зависимостей' },
            },
            {
                path: 'maven-download',
                name: 'MavenDownload',
                component: () => import('@/pages/MavenDownloadPage.vue'),
                meta: { title: 'Загрузите файл MAVEN' },
            },
            {
                path: 'gradle-download',
                name: 'GradleDownload',
                component: () => import('@/pages/GradleDownloadPage.vue'),
                meta: { title: 'Загрузите файл GRADLE' },
            },
            {
                path: 'python-download',
                name: 'PythonDownload',
                component: () => import('@/pages/PythonDownloadPage.vue'),
                meta: { title: 'Загрузите файл PYTHON' },
            },
            {
                path: 'analyze',
                name: 'AnalyzeDependency',
                component: () => import('@/pages/AnalyzeDependencyPage.vue'),
                meta: { title: 'Анализируйте и управляйте зависимостями' },
            },
            {
                path: 'export',
                name: 'Export',
                component: () => import('@/pages/ExportPage.vue'),
                meta: { title: 'Экспорт обновлённого pom.xml' },
            },
        ],
    },

    // 404 → домой или отрисовать страницу 404
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    // скролл вверх при смене страниц
    scrollBehavior() {
        return { top: 0 };
    },
});

function isAuthenticated(): boolean {
    return !!localStorage.getItem('dm_token')
}

router.beforeEach((to) => {
    const authed = isAuthenticated()

    // защищённые маршруты
    if (to.matched.some(r => r.meta?.requiresAuth) && !authed) {
        return { name: 'auth', query: { redirect: to.fullPath } }
    }

    // страница входа только для гостей
    if (to.matched.some(r => r.meta?.guestOnly) && authed) {
        return { name: 'home' }
    }
})


// динамически меняем document.title
router.afterEach((to) => {
    if (to.meta?.title) {
        document.title = String(to.meta.title);
    }
});

export default router;
