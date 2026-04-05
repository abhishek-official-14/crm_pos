import { mockCustomers, mockProducts } from '../data/mockData';

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// API-ready abstraction layer:
// Replace mock payloads with fetch/axios calls when backend endpoints are available.
export const api = {
  async getCustomers() {
    await delay();
    return mockCustomers;
  },

  async createCustomer(payload) {
    await delay();
    return { ...payload, id: Date.now() };
  },

  async getProducts() {
    await delay();
    return mockProducts;
  },

  async createOrder(payload) {
    await delay();
    return { ...payload, id: Date.now(), createdAt: new Date().toISOString() };
  },
};
