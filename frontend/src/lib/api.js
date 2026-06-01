import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Kalau token admin sudah kadaluarsa/tidak valid (401), arahkan kembali ke login
// dengan bersih — tidak menampilkan error membingungkan di dashboard.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isLoginRequest = url.includes('/auth/login');

    // Jangan redirect untuk request login (biarkan halaman login tampilkan errornya sendiri)
    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem('admin_token');
      // Hanya redirect kalau sedang di area admin (jangan ganggu halaman mahasiswa)
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
