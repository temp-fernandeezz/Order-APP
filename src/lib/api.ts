import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.0.109:8000/",
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Get CSRF token from Laravel Sanctum
export const getCsrfToken = async (): Promise<string> => {
  try {
    // First try to get from cookies
    const csrfToken = extractCsrfToken();
    if (csrfToken) return csrfToken;
    
    // If not found, make a request to get a fresh one
    await api.get('/sanctum/csrf-cookie', { withCredentials: true });
    const newToken = extractCsrfToken();
    if (!newToken) throw new Error('CSRF token not found');
    return newToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    throw error;
  }
};

export const extractCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null; // For SSR
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

// Token management
export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

export const clearAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token');
  if (token) {
    setAuthToken(token);
  }
}

export default api;