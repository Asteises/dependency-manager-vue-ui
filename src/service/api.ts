import type {MavenGroupArtifactVersions, MvnFullDependencyDto} from "@/types/maven-types.ts";


const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export const endpoints = {
    maven: {
        upload: `${API_BASE}/maven/pom/upload`,
        full: `${API_BASE}/maven/pom/current-model`,
        deps: `${API_BASE}/maven/dependencies/versions/batch`,
        parent: `${API_BASE}/maven/dependencies/parent-dependency`,
        download: `${API_BASE}/maven/pom/beautifier-pom`,
    },
    gradle: {
        deps: `${API_BASE}/gradle/dependencies`,
    },
    python: {
        deps: `${API_BASE}/python/dependencies`,
    },
} as const;

async function asJson<T>(res: Response): Promise<T> {
    const text = await res.text();
    if (!res.ok) {

        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return text ? JSON.parse(text) as T : (undefined as unknown as T);
}

export async function postFileJson<T>(url: string, file: File, user: string, signal?: AbortSignal): Promise<T> {
    const form = new FormData();
    form.append('file', file);
    form.append('user', user);

    const res = await fetch(url, {method: 'POST', body: form, signal});

    return asJson<T>(res);
}

export const api = {

    maven: {
        async uploadAndFetchModel(file: File, user: string, signal?: AbortSignal): Promise<MvnFullDependencyDto> {
            // 1. Загружаем файл
            const form = new FormData();
            form.append('file', file);
            form.append('user', user);
            const uploadRes = await fetch(endpoints.maven.upload, {
                method: 'POST',
                body: form,
                signal
            });
            if (!uploadRes.ok) {
                const text = await uploadRes.text();
                throw new Error(`Upload failed: ${uploadRes.status} ${text}`);
            }

            // 2. Загружаем модель
            const modelRes = await fetch(endpoints.maven.full, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({user}),
                signal
            });
            return asJson<MvnFullDependencyDto>(modelRes);
        },

        async fetchVersionsBatch(
            dependencies: { groupId: string; artifactId: string }[],
            signal?: AbortSignal
        ): Promise<MavenGroupArtifactVersions[]> {
            const res = await fetch(endpoints.maven.deps, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(dependencies),
                signal
            });
            return asJson<MavenGroupArtifactVersions[]>(res);
        },

        async exportFile(user: string, signal?: AbortSignal) {
            const res = await fetch(`${endpoints.maven.download}?user=${user}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                signal
            });
            return res.text();
        }
    },
    gradle: {},
    python: {},
};