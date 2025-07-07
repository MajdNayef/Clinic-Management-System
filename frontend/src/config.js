// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'clinic-management-system-production-f839.up.railway.app';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
    AUTH: {
        REGISTER: '/api/auth/register',
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        FORGOT_PASSWORD: '/api/auth/forgot-password',
    },
    // Add more endpoints as needed
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`; 