import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/v1/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const inFlightGets = new Map<string, Promise<unknown>>();

function limparGetsAposEscrita(method?: string) {
  if (method && method.toLowerCase() !== 'get') {
    inFlightGets.clear();
  }
}

// Uma escrita invalida GETs em andamento para que o próximo carregamento traga dados atualizados
api.interceptors.response.use(
  (response) => {
    limparGetsAposEscrita(response.config.method);
    return response;
  },
  (error) => {
    limparGetsAposEscrita(error.config?.method);
    return Promise.reject(error);
  }
);

/**
 * Executa um GET reaproveitando uma chamada idêntica que ainda esteja em andamento.
 * Evita requisições duplicadas, inclusive as causadas pelo StrictMode em desenvolvimento.
 */
export function getDeduplicado<T>(url: string, params: object): Promise<T> {
  const key = `${url}?${JSON.stringify(params)}`;
  const pending = inFlightGets.get(key);
  if (pending) return pending as Promise<T>;

  const request: Promise<T> = api
    .get<T>(url, { params })
    .then((response) => response.data)
    .finally(() => {
      if (inFlightGets.get(key) === request) {
        inFlightGets.delete(key);
      }
    });

  inFlightGets.set(key, request);
  return request;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage;
    }
    if (!error.response) {
      return 'Não foi possível conectar ao servidor. Verifique se o backend está em execução.';
    }
  }
  return fallback;
}
