import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function apiClient(endpoint, { body, ...customConfig } = {}) {
  const token = localStorage.getItem('trc_token');
  const isFormData = body instanceof FormData;
  // FormData sets its own multipart Content-Type (with boundary) — never
  // override it, and never JSON.stringify a FormData body.
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: { ...headers, ...customConfig.headers },
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout();
      // Optional: show toast globally here, but typically zustand or a component handles UI side effects
    }
    const err = new Error(data.error?.message || 'Something went wrong');
    err.details = data.error?.details;
    err.code = data.error?.code;
    throw err;
  }

  return data.data;
}
