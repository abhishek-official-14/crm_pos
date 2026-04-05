import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bootstrapData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [customerData, productData] = await Promise.all([api.getCustomers(), api.getProducts()]);
      setCustomers(customerData);
      setProducts(productData);
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrapData();
  }, [bootstrapData]);

  const addCustomer = async (payload) => {
    setLoading(true);
    setError('');
    try {
      const created = await api.createCustomer(payload);
      setCustomers((prev) => [created, ...prev]);
    } catch {
      setError('Unable to add customer right now.');
      throw new Error('addCustomer failed');
    } finally {
      setLoading(false);
    }
  };

  const addOrder = async (payload) => {
    setLoading(true);
    setError('');
    try {
      const created = await api.createOrder(payload);
      setOrders((prev) => [created, ...prev]);
    } catch {
      setError('Unable to place order right now.');
      throw new Error('addOrder failed');
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      customers,
      products,
      orders,
      loading,
      error,
      bootstrapData,
      addCustomer,
      addOrder,
    }),
    [customers, products, orders, loading, error, bootstrapData],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
