/**
 * API client per comunicare con il backend FastAPI.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
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
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Errore di rete' }));
      throw new ApiError(response.status, error.detail || 'Errore sconosciuto');
    }

    return response.json();
  }

  // Shorthand methods
  get<T>(endpoint: string) { return this.request<T>(endpoint); }
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
