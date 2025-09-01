import type {MvnDependencyDTO, MvnDTO, MvnFullDependencyDto} from "@/types/maven-types.ts";


const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export const endpoints = {
    maven: {
        full: `${API_BASE}/maven/dependencies`,     // -> MvnFullDependencyDto
        deps: `${API_BASE}/maven/dependencies/pom-dependencies`,      // -> MvnDTO
        parent: `${API_BASE}/maven/dependencies/parent-dependency`,   // -> MvnParentDTO
    },
    gradle: {
        deps: `${API_BASE}/gradle/dependencies`,                      // -> { dependencies: MvnDependencyDTO[] } | свой DTO
    },
    python: {
        deps: `${API_BASE}/python/dependencies`,                      // -> { dependencies: { name: string; version: string }[] }
    },
} as const;

async function asJson<T>(res: Response): Promise<T> {
    const text = await res.text();
    if (!res.ok) {

        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return text ? JSON.parse(text) as T : (undefined as unknown as T);
}

export async function postFileJson<T>(url: string, file: File, signal?: AbortSignal): Promise<T> {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(url, { method: 'POST', body: form, signal });

    return asJson<T>(res);
}

export const api = {

    maven: {
        uploadFull(file: File, signal?: AbortSignal) {
            return postFileJson<MvnFullDependencyDto>(endpoints.maven.full, file, signal);
        },
        uploadDeps(file: File, signal?: AbortSignal) {
            return postFileJson<MvnDTO>(endpoints.maven.deps, file, signal);
        },
    },
    gradle: {
        uploadDeps(file: File, signal?: AbortSignal) {
            return postFileJson<{ dependencies: MvnDependencyDTO[] }>(endpoints.gradle.deps, file, signal);
        },
    },
    python: {
        uploadDeps(file: File, signal?: AbortSignal) {
            return postFileJson<{ dependencies: Array<{ name: string; version: string }> }>(endpoints.python.deps, file, signal);
        },
    },
};