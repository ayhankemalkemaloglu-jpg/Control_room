// Runtime connection settings. The API base + auth token can come from build-time
// env (VITE_*) or be overridden at runtime via the in-app Settings (localStorage),
// so the deployed bundle never has to embed a secret.

const LS_API = 'hermes.apiBase';
const LS_TOKEN = 'hermes.authToken';

const ENV_API = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
const ENV_TOKEN = (import.meta.env.VITE_AUTH_TOKEN as string | undefined)?.trim();

function readLS(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getApiBase(): string {
  return stripTrailingSlash(readLS(LS_API) || ENV_API || 'http://localhost:4000');
}

export function getAuthToken(): string {
  return readLS(LS_TOKEN) || ENV_TOKEN || '';
}

export function saveSettings(apiBase: string, token: string): void {
  try {
    localStorage.setItem(LS_API, stripTrailingSlash(apiBase.trim()));
    localStorage.setItem(LS_TOKEN, token.trim());
  } catch {
    /* localStorage unavailable (private mode) — settings just won't persist */
  }
}
