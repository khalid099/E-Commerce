import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true, // sends httpOnly cookie on every request
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl: string = error.config?.url ?? '';
    const isAuthCheck = requestUrl.includes('/auth/');

    // Only redirect to login for non-auth 401s (don't loop from /auth/me on public pages)
    if (error.response?.status === 401 && !isAuthCheck && typeof window !== 'undefined') {
      const { pathname } = window.location;
      if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
        try {
          localStorage.removeItem('shophive-auth');
        } catch {}
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
