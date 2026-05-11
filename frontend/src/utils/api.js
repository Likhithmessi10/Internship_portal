import axios from 'axios';

// Reads from VITE_API_URL in .env file (set to your server's IP/domain for production)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
export const MEDIA_URL = API_URL.replace('/api/v1', '');

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

// Response interceptor to handle expired tokens
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Check if this was a login attempt
            const isLoginRequest = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
            
            if (!isLoginRequest) {
                // For any other 401, the session is likely expired
                console.warn('Session expired. Logging out...');
                localStorage.removeItem('token');
                // Force a full page reload to the landing page to clear all state
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
