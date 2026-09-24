import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      try {
        const params = new URLSearchParams();
        params.append('username', 'admin');
        params.append('password', 'admin123');
        const res = await axios.post('/api/v1/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const token = res.data.access_token;
        localStorage.setItem('token', token);
        error.config.headers.Authorization = `Bearer ${token}`;
        return axios(error.config);
      } catch (e) {
        console.error('Auto auth retry failed:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
