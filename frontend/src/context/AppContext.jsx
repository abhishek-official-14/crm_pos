import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, authStorage, extractErrorMessage } from '../services/api';

const AppContext = createContext(null);

const initialLoading = {
  auth: false,
  bootstrap: false,
  addCustomer: false,
  addOrder: false,
  addProduct: false,
  analytics: false,
  exportCsv: false,
};

const getEntityId = (entity) => String(entity?.id || entity?._id || '');

const mergeEntityCollections = (existing = [], incoming = []) => {
  const map = new Map(existing.map((item) => [getEntityId(item), item]));

  incoming.forEach((item) => {
    const key = getEntityId(item);
    if (!key) return;
    const previous = map.get(key) || {};
    map.set(key, { ...previous, ...item, id: key });
  });

  return Array.from(map.values());
};

const getLowStockAlerts = (productItems = []) =>
  productItems.filter((product) => Number(product.stock) <= Number(product.lowStockThreshold ?? 10));

const initialErrors = {
  auth: '',
  bootstrap: '',
  addCustomer: '',
  addOrder: '',
  addProduct: '',
  analytics: '',
  exportCsv: '',
};

export function AppProvider({ children }) {
  const [authReady, setAuthReady] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({ daily: [], monthly: [] });
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  const [loading, setLoading] = useState(initialLoading);
  const [errors, setErrors] = useState(initialErrors);

  const updateLoading = useCallback((key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateError = useCallback((key, value) => {
    setErrors((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetDomainData = useCallback(() => {
    setCustomers([]);
    setProducts([]);
    setOrders([]);
    setAnalytics({ daily: [], monthly: [] });
    setLowStockAlerts([]);
  }, []);

  const setAuthData = useCallback((authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);
    authStorage.setToken(authToken);
    authStorage.setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    authStorage.clearAuth();
    setToken('');
    setUser(null);
    resetDomainData();
    setErrors(initialErrors);
    setLoading(initialLoading);
  }, [resetDomainData]);

  const fetchAnalytics = useCallback(async () => {
    updateLoading('analytics', true);
    updateError('analytics', '');
    try {
      const [daily, monthly] = await Promise.all([
        api.getOrderAnalytics({ period: 'daily' }),
        api.getOrderAnalytics({ period: 'monthly' }),
      ]);
      setAnalytics({ daily: daily.items, monthly: monthly.items });
    } catch (error) {
      updateError('analytics', extractErrorMessage(error, 'Unable to fetch analytics.'));
    } finally {
      updateLoading('analytics', false);
    }
  }, [updateError, updateLoading]);

  const bootstrapData = useCallback(async () => {
    if (!authStorage.getToken()) {
      resetDomainData();
      return;
    }

    updateLoading('bootstrap', true);
    updateError('bootstrap', '');

    try {
      const [customerData, productData, orderData] = await Promise.all([
        api.getCustomers({ page: 1, limit: 100 }),
        api.getProducts({ page: 1, limit: 100 }),
        api.getOrders({ page: 1, limit: 100 }),
      ]);
      setCustomers(customerData.items);
      setProducts(productData.items);
      setOrders(orderData.items);
      setLowStockAlerts(getLowStockAlerts(productData.items));
      await fetchAnalytics();
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to load data. Please retry.');
      updateError('bootstrap', message);
      if (error?.response?.status === 401) {
        logout();
      }
    } finally {
      updateLoading('bootstrap', false);
    }
  }, [fetchAnalytics, logout, resetDomainData, updateError, updateLoading]);

  useEffect(() => {
    const storedToken = authStorage.getToken();
    const storedUser = authStorage.getUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }

    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!token) {
      resetDomainData();
      return;
    }

    bootstrapData();
  }, [authReady, token, bootstrapData, resetDomainData]);

  const login = useCallback(
    async (payload) => {
      updateLoading('auth', true);
      updateError('auth', '');
      try {
        const response = await api.login(payload);
        setAuthData(response.token, response.user);
        return response.user;
      } catch (error) {
        const message = extractErrorMessage(error, 'Unable to sign in right now.');
        updateError('auth', message);
        throw new Error(message);
      } finally {
        updateLoading('auth', false);
      }
    },
    [setAuthData, updateError, updateLoading],
  );

  const register = useCallback(
    async (payload) => {
      updateLoading('auth', true);
      updateError('auth', '');
      try {
        await api.register(payload);
      } catch (error) {
        const message = extractErrorMessage(error, 'Unable to register right now.');
        updateError('auth', message);
        throw new Error(message);
      } finally {
        updateLoading('auth', false);
      }
    },
    [updateError, updateLoading],
  );

  const addCustomer = useCallback(
    async (payload) => {
      updateLoading('addCustomer', true);
      updateError('addCustomer', '');
      try {
        const created = await api.createCustomer(payload);
        setCustomers((prev) => [created, ...prev]);
        return created;
      } catch (error) {
        const message = extractErrorMessage(error, 'Unable to add customer right now.');
        updateError('addCustomer', message);
        throw new Error(message);
      } finally {
        updateLoading('addCustomer', false);
      }
    },
    [updateError, updateLoading],
  );

  const addProduct = useCallback(
    async (payload) => {
      updateLoading('addProduct', true);
      updateError('addProduct', '');
      try {
        const created = await api.createProduct(payload);
        let nextProducts = [];
        setProducts((prev) => {
          nextProducts = [created, ...prev];
          return nextProducts;
        });
        setLowStockAlerts(getLowStockAlerts(nextProducts));
        return created;
      } catch (error) {
        const message = extractErrorMessage(error, 'Unable to create product right now.');
        updateError('addProduct', message);
        throw new Error(message);
      } finally {
        updateLoading('addProduct', false);
      }
    },
    [updateError, updateLoading],
  );

  const addOrder = useCallback(
    async ({ productId, customerId, quantity, gstRate }) => {
      updateLoading('addOrder', true);
      updateError('addOrder', '');
      try {
        const response = await api.createOrder({
          customer: customerId,
          gstRate: Number(gstRate),
          items: [{ product: productId, quantity: Number(quantity) }],
        });

        setOrders((prev) => [response.order, ...prev]);

        if (Array.isArray(response.meta?.updatedProducts) && response.meta.updatedProducts.length > 0) {
          setProducts((prevProducts) => mergeEntityCollections(prevProducts, response.meta.updatedProducts));
        }

        setLowStockAlerts(response.meta?.lowStockAlerts || []);
        fetchAnalytics();
        return response.order;
      } catch (error) {
        const message = extractErrorMessage(error, 'Unable to place order right now.');
        updateError('addOrder', message);
        throw new Error(message);
      } finally {
        updateLoading('addOrder', false);
      }
    },
    [fetchAnalytics, updateError, updateLoading],
  );

  const downloadInvoicePdf = useCallback(
    async (orderId) => {
      const authToken = authStorage.getToken();
      const response = await fetch(api.getOrderInvoiceDownloadUrl(orderId), {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to download invoice right now.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `invoice-${orderId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    [],
  );

  const exportOrdersCsv = useCallback(async () => {
    updateLoading('exportCsv', true);
    updateError('exportCsv', '');
    try {
      const authToken = authStorage.getToken();
      const response = await fetch(api.getOrdersCsvExportUrl(), {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('CSV export failed.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'orders-report.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      updateError('exportCsv', extractErrorMessage(error, 'Unable to export CSV report.'));
      throw error;
    } finally {
      updateLoading('exportCsv', false);
    }
  }, [updateError, updateLoading]);

  const value = useMemo(
    () => ({
      authReady,
      isAuthenticated: Boolean(token),
      token,
      user,
      customers,
      products,
      orders,
      analytics,
      lowStockAlerts,
      loading,
      errors,
      login,
      register,
      logout,
      bootstrapData,
      fetchAnalytics,
      addCustomer,
      addProduct,
      addOrder,
      downloadInvoicePdf,
      exportOrdersCsv,
    }),
    [
      authReady,
      token,
      user,
      customers,
      products,
      orders,
      analytics,
      lowStockAlerts,
      loading,
      errors,
      login,
      register,
      logout,
      bootstrapData,
      fetchAnalytics,
      addCustomer,
      addProduct,
      addOrder,
      downloadInvoicePdf,
      exportOrdersCsv,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
