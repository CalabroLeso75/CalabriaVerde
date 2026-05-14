/**
 * API client per comunicare con il backend FastAPI.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuthRedirect?: boolean;
}

function clearAuthState() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.dispatchEvent(new Event('auth-state-changed'));
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const loginUrl = `${APP_BASE_PATH}/login/`.replace(/\/{2,}/g, '/');
  window.location.replace(loginUrl);
}

function isAuthFailure(status: number, detail: string, hadToken: boolean) {
  if (status === 401) return true;
  if (status === 403 && hadToken) return true;

  const normalized = detail.toLowerCase();
  return normalized.includes('token non valido')
    || normalized.includes('token non valido o scaduto')
    || normalized.includes('not authenticated')
    || normalized.includes('non autenticato');
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, skipAuthRedirect = false } = options;
    const authHeaders = this.getAuthHeaders();
    const hadToken = Boolean(authHeaders.Authorization);

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Errore di rete' }));
      const detail = error.detail || 'Errore sconosciuto';

      if (!skipAuthRedirect && isAuthFailure(response.status, detail, hadToken)) {
        clearAuthState();
        redirectToLogin();
        return new Promise<T>(() => {});
      }

      throw new ApiError(response.status, detail);
    }

    if (response.status === 204 || response.status === 205) {
      return undefined as T;
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      return undefined as T;
    }

    return response.json();
  }

  // Shorthand methods
  get<T>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) { return this.request<T>(endpoint, options); }
  post<T>(endpoint: string, body: unknown) { return this.request<T>(endpoint, { method: 'POST', body }); }
  put<T>(endpoint: string, body: unknown) { return this.request<T>(endpoint, { method: 'PUT', body }); }
  delete<T>(endpoint: string) { return this.request<T>(endpoint, { method: 'DELETE' }); }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const api = new ApiClient(API_BASE);
