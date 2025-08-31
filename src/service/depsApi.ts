import type { Manager } from '@/stores/dependencies';

export interface Dependency {
    id: string;
    manager: Manager;
    groupId: string;
    artifactId: string;
    currentVersion: string;
    latestVersion: string;
    allVersions: string[];
    icon?: string;
}

export interface FetchDepsResult {
    status: 200 | 304;
    etag?: string | null;
    data?: Dependency[]; // есть только при 200
}

const API_BASE = '/api';

async function fetchWithTimeout(input: RequestInfo, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
    const { timeoutMs = 10_000, signal } = init;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Объединяем внешний signal (если был) с нашим
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort, { once: true });

    try {
        const res = await fetch(input, { ...init, signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timeoutId);
        signal?.removeEventListener('abort', onAbort);
    }
}

/**
 * Получить зависимости по менеджеру с условным GET (ETag).
 * Если сервер вернёт 304, мы не парсим тело и просто сообщаем, что изменений нет.
 */
export async function fetchDependencies(manager: Manager, etag?: string | null): Promise<FetchDepsResult> {
    const headers: HeadersInit = { Accept: 'application/json' };
    if (etag) headers['If-None-Match'] = etag;

    const res = await fetchWithTimeout(`${API_BASE}/dependencies?manager=${encodeURIComponent(manager)}`, {
        method: 'GET',
        headers,
        // Важно: без кеширования на уровне браузера, пусть решает сервер + ETag
        cache: 'no-store',
        timeoutMs: 10_000,
    });

    if (res.status === 304) {
        return { status: 304, etag };
    }

    if (!res.ok) {
        // здесь можно сделать маппинг ошибок по статусам (401/403/5xx)
        const text = await res.text().catch(() => '');
        throw new Error(`Failed to fetch dependencies: ${res.status} ${res.statusText} ${text}`);
    }

    // Считываем новый ETag (могут отдать в любом регистре, но стандарт — ETag)
    const newEtag = res.headers.get('ETag');

    // Безопасно парсим JSON (на случай пустого тела)
    const data = (await res.json().catch(() => null)) as Dependency[] | null;
    if (!Array.isArray(data)) {
        throw new Error('Invalid dependencies payload');
    }

    return { status: 200 as const, etag: newEtag, data };
}
