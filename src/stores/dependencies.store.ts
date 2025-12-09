import {defineStore} from 'pinia';
import {computed, ref, watch} from 'vue';
import type {Dependency, MavenGroupArtifact} from "@/types/maven-types.ts";
import {mapMavenFullToDeps} from "@/service/mapper.ts";
import {api} from "@/service/api.ts";


export type Manager = 'maven' | 'gradle' | 'python';

interface PersistedState {
    items: Dependency[];
    lastUpdated?: string | null;
}

const STORAGE_KEY = 'dmui:deps';

function loadPersisted(): PersistedState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) as PersistedState : null;
    } catch {
        return null;
    }
}

export const useDependenciesStore = defineStore('dependencies', () => {
    const items = ref<Dependency[]>([]);
    const loading = ref(false);
    const lastUpdated = ref<Date | null>(null);

    const changedDependencies = computed(() => {
        return items.value.filter(dep =>
            dep.selectedVersion !== dep.currentVersion
        );
    });

    const unchangedDependencies = computed(() => {
        return items.value.filter(dep =>
            dep.selectedVersion === dep.currentVersion
        );
    });

    // Гидратация
    const persisted = loadPersisted();
    if (persisted?.items?.length) {
        items.value = persisted.items;
        lastUpdated.value = persisted.lastUpdated ? new Date(persisted.lastUpdated) : null;
    }

    // Персист
    watch(items, () => {
        const payload: PersistedState = {
            items: items.value,
            lastUpdated: lastUpdated.value?.toISOString() ?? null,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, {deep: true});

    // ===== Публичные действия =====

    function setDependencies(list: Dependency[]) {
        items.value = list.map(d => ({
            ...d,
            id: d.id || `${d.groupId}:${d.artifactId}`,
            selectedVersion: d.selectedVersion ?? d.currentVersion,
        }));
        lastUpdated.value = new Date();
    }

    function updateSelection(depId: string, version: string) {
        const d = items.value.find(x => x.id === depId);
        if (d) d.selectedVersion = version;
    }

    function applyLatestToAll() {
        items.value = items.value.map(d => ({
            ...d,
            selectedVersion: d.latestVersion || d.currentVersion,
        }));
        lastUpdated.value = new Date();
    }

    async function loadMavenFull(file: File, signal?: AbortSignal) {
        console.groupCollapsed('dependencies.store.loadMavenFull');
        loading.value = true;
        try {
            // 1. Проверяем пользователя TODO: нужно будет переделать
            const user = localStorage.getItem('dm_user') || 'guest';
            console.log("Получен запрос на обработку файла .pom для пользователя:", user)

            // 2. Отправляем файл на бэкенд, обрабатываем и возвращаем готовый вариант для отрисовки
            const dto = await api.maven.uploadAndFetchModel(file, user);
            console.log("Обработали файл:", dto)

            // 3. Проверяем наличие зависимостей и собираем последние версии
            if (!dto?.dependencies.length) {
                console.log('Нет базовых зависимостей');
                console.groupEnd();
                return [];
            } else {
                const gaList: MavenGroupArtifact[] = dto.dependencies.map(dep => ({
                    groupId: dep.groupId,
                    artifactId: dep.artifactId
                }));

                console.log('Запрашиваем версии для', gaList.length, 'зависимостей');
                const versionsBatch = await api.maven.fetchVersionsBatch(gaList, signal);
                console.log('Получены версии:', versionsBatch);

                const deps = mapMavenFullToDeps(dto, versionsBatch);
                setDependencies(deps);
            }
        } finally {
            loading.value = false;
        }
    }

    async function exportPomFile(user: string, signal?: AbortSignal) {
        console.groupCollapsed('dependencies.store.exportPomFile');
        try {
            const pom = await api.maven.exportFile('guest', signal);

            console.log('Получен pom.xml (первые 200 символов):', pom.substring(0, 200));
            console.log("Получили файл pom для пользователя:", user);
            return pom;
        } catch (error) {
            console.log("Ошибка при экспорте файла pom:", error);
        }
    }

    function saveSelections() {
        lastUpdated.value = new Date();
    }

    return {
        items, loading, lastUpdated,
        setDependencies, updateSelection, applyLatestToAll, saveSelections,
        loadMavenFull, changedDependencies, unchangedDependencies,
        exportPomFile,
    };
});
