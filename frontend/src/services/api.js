import axios from 'axios';

const TOKEN_KEY = 'crm_pos_token';
const USER_KEY = 'crm_pos_user';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 12000,
});

const isRetryableError = (error) => {
  if (!error.response) return true;
  return error.response.status >= 500 || error.response.status === 429;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestWithRetry = async (requestFn, options = {}) => {
  const { retries = 0, retryDelayMs = 500 } = options;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < retries && isRetryableError(error);
      if (!shouldRetry) break;
      await wait(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError;
};

const normalizeEntity = (entity) => {
  if (!entity) return entity;
  return {
    ...entity,
    id: entity._id || entity.id,
  };
};

const extractErrorMessage = (error, fallback = 'Something went wrong.') => {
  const apiMessage = error?.response?.data?.message;
  const validationErrors = error?.response?.data?.errors;

  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    return validationErrors.map((item) => item.msg).join(', ');
  }

  return apiMessage || error.message || fallback;
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: () => {
    const value = localStorage.getItem(USER_KEY);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clearUser: () => localStorage.removeItem(USER_KEY),
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const api = {
  async register(payload) {
    const { data } = await apiClient.post('/auth/register', {
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      role: payload.role || 'STAFF',
    });
    return data.data;
  },

  async login(payload) {
    const { data } = await apiClient.post('/auth/login', payload);
    return data.data;
  },

  async getCustomers(params = {}) {
    const { data } = await requestWithRetry(
      () => apiClient.get('/customers', { params }),
      { retries: 2, retryDelayMs: 500 },
    );

    return {
      items: (data.data || []).map(normalizeEntity),
      meta: data.meta,
    };
  },

  async createCustomer(payload) {
    const { data } = await apiClient.post('/customers', payload);
    return normalizeEntity(data.data);
  },

  async getProducts(params = {}) {
    const { data } = await requestWithRetry(
      () => apiClient.get('/products', { params }),
      { retries: 2, retryDelayMs: 500 },
    );

    return {
      items: (data.data || []).map(normalizeEntity),
      meta: data.meta,
    };
  },

  async createProduct(payload) {
    const { data } = await apiClient.post('/products', payload);
    return normalizeEntity(data.data);
  },

  async getOrders(params = {}) {
    const { data } = await requestWithRetry(
      () => apiClient.get('/orders', { params }),
      { retries: 2, retryDelayMs: 500 },
    );

    return {
      items: (data.data || []).map(normalizeEntity),
      meta: data.meta,
    };
  },

  async createOrder(payload) {
    const { data } = await apiClient.post('/orders', payload);
    return normalizeEntity(data.data);
  },
};

export { extractErrorMessage };
