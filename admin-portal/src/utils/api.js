import axios from 'axios';

// Reads from VITE_API_URL in .env file (set to your server's IP/domain for production)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to add JWT token to every request
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor to handle global response errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Auto-logout on 401 errors
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/admin/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
