import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// Books API calls
export const booksAPI = {
  getBooks: () => api.get('/books'),
  getBook: (id) => api.get(`/books/${id}`),
  createBook: (bookData) => {
    const formData = new FormData();
    Object.keys(bookData).forEach(key => {
      formData.append(key, bookData[key]);
    });
    return api.post('/books', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateBook: (id, bookData) => {
    const formData = new FormData();
    Object.keys(bookData).forEach(key => {
      formData.append(key, bookData[key]);
    });
    return api.put(`/books/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteBook: (id) => api.delete(`/books/${id}`),
  searchBooks: (query) => api.get(`/books/search?query=${query}`),
};

export default api;
