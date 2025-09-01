import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type {Dependency, MvnDTO, MvnFullDependencyDto} from "@/types/maven-types.ts";
import {mapGradleToDeps, mapMavenFullToDeps, mapMavenToDeps, mapPythonToDeps} from "@/service/mapper.ts";
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
    }, { deep: true });

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

    async function loadMavenFull(file: File) {
        console.groupCollapsed('dependencies.loadMavenFull:')
        loading.value = true;
        try {
            const dto: MvnFullDependencyDto = await api.maven.uploadFull(file);
            console.log('MvnFullDependencyDto: ', dto);

            const deps = mapMavenFullToDeps(dto);
            console.log('Dependency[]: ', deps);

            setDependencies(deps);
            console.groupEnd()
        } finally {
            loading.value = false;
            console.groupEnd()
        }
    }

    async function loadMavenPlain(file: File) {
        loading.value = true;
        try {
            const dto: MvnDTO = await api.maven.uploadDeps(file);
            const deps = mapMavenToDeps(dto);
            setDependencies(deps);
        } finally {
            loading.value = false;
        }
    }

    async function loadGradle(file: File) {
        loading.value = true;
        try {
            const payload = await api.gradle.uploadDeps(file);
            const deps = mapGradleToDeps(payload);
            setDependencies(deps);
        } finally {
            loading.value = false;
        }
    }

    async function loadPython(file: File) {
        loading.value = true;
        try {
            const payload = await api.python.uploadDeps(file);
            const deps = mapPythonToDeps(payload);
            setDependencies(deps);
        } finally {
            loading.value = false;
        }
    }

    function saveSelections() {
        lastUpdated.value = new Date();
    }

    return {
        items, loading, lastUpdated,
        setDependencies, updateSelection, applyLatestToAll, saveSelections,
        loadMavenFull, loadMavenPlain, loadGradle, loadPython,
    };
});
