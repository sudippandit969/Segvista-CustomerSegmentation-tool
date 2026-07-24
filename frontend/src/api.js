const configuredApiUrl = import.meta.env.VITE_API_URL;

export const API_BASE_URL = (
  configuredApiUrl || 'http://localhost:8000'
).replace(/\/+$/, '');

export const apiUrl = (path) => `${API_BASE_URL}${path}`;

