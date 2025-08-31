import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type Manager = 'maven' | 'gradle' | 'python';

export type MvnDependencyDTO = {
    groupId: string;
    artifactId: string;
    version: string;
    scope?: string | null;
};
export type MvnParentDTO = {
    groupId: string;
    artifactId: string;
    version: string;
};
export type MvnDTO = {
    parent: MvnParentDTO | null;
    dependencies: MvnDependencyDTO[];
};

export interface Dependency {
    id: string;                 // уникальный ID (groupId:artifactId)
    manager: Manager;           // тип проекта
    groupId: string;            // напр. org.springframework.boot
    artifactId: string;         // напр. spring-boot-starter-web
    currentVersion: string;     // версия в файле пользователя
    latestVersion: string;      // последняя доступная (по данным сервера/репо)
    allVersions: string[];      // полный список версий
    selectedVersion?: string;   // версия, выбранная пользователем
    icon?: string;              // путь к иконке (опционально)
}

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

    // Гидратация из localStorage (если есть)
    const persisted = loadPersisted();
    if (persisted?.items?.length) {
        items.value = persisted.items;
        lastUpdated.value = persisted.lastUpdated ? new Date(persisted.lastUpdated) : null;
    }

    // Персист в localStorage
    watch(items, () => {
        const payload: PersistedState = {
            items: items.value,
            lastUpdated: lastUpdated.value?.toISOString() ?? null,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, { deep: true });

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

    // Имитация обновления с сервера
    async function refreshAll() {
        loading.value = true;
        await new Promise(r => setTimeout(r, 900)); // имитация сети
        // Пример «наивного» апдейта latestVersion + добавление пары версий
        items.value = items.value.map(d => {
            const nextPatch = bumpPatch(d.latestVersion || d.currentVersion);
            const extended = unique([nextPatch, d.latestVersion, ...d.allVersions].filter(Boolean));
            return { ...d, latestVersion: nextPatch, allVersions: extended };
        });
        lastUpdated.value = new Date();
        loading.value = false;
    }

    function saveSelections() {
        // Здесь можно сделать POST на бэкенд
        lastUpdated.value = new Date();
    }

    return {
        items, loading, lastUpdated,
        setDependencies, updateSelection, refreshAll, saveSelections, applyLatestToAll
    };
});

// helpers
function bumpPatch(v: string): string {
    const m = v.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!m) return v;
    const [ , a, b, c] = m;
    return `${a}.${b}.${Number(c)+1}`;
}
function unique<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
}
