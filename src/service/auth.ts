export type AuthResponse = {
    token: string
    user?: { id: string; email: string }
}

const BASE_URL =
    (import.meta as any).env?.VITE_API_URL?.toString().replace(/\/$/, '') || '/api'

async function request<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // если Spring отдает cookie
        body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
        const msg = (json && (json.message || json.error)) || res.statusText
        throw new Error(msg)
    }
    return json as T
}

export const authApi = {
    signIn(email: string, password: string) {
        return request<AuthResponse>(`${BASE_URL}/auth/login`, { email, password })
    },
    signUp(email: string, password: string) {
        return request<AuthResponse>(`${BASE_URL}/auth/register`, { email, password })
    },
}
