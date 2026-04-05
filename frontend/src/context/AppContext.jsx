import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, authStorage, extractErrorMessage } from '../services/api';

const AppContext = createContext(null);

const initialLoading = {
  auth: false,
  bootstrap: false,
  addCustomer: false,
  addOrder: false,
  addProduct: false,
};

const initialErrors = {
  auth: '',
  bootstrap: '',
  addCustomer: '',
  addOrder: '',
  addProduct: '',
};

export function AppProvider({ children }) {
  const [authReady, setAuthReady] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

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
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to load data. Please retry.');
      updateError('bootstrap', message);
      if (error?.response?.status === 401) {
        logout();
      }
    } finally {
      updateLoading('bootstrap', false);
    }
  }, [logout, resetDomainData, updateError, updateLoading]);

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
        setProducts((prev) => [created, ...prev]);
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
    async ({ productId, customerId, quantity }) => {
      updateLoading('addOrder', true);
      updateError('addOrder', '');
      try {
        const created = await api.createOrder({
          customer: customerId,
          items: [{ product: productId, quantity: Number(quantity) }],
        });
        setOrders((prev) => [created, ...prev]);
        return created;
      } catch (error) {
        const message = extractErrorMessage(error, 'Unable to place order right now.');
        updateError('addOrder', message);
        throw new Error(message);
      } finally {
        updateLoading('addOrder', false);
      }
    },
    [updateError, updateLoading],
  );

  const value = useMemo(
    () => ({
      authReady,
      isAuthenticated: Boolean(token),
      token,
      user,
      customers,
      products,
      orders,
      loading,
      errors,
      login,
      register,
      logout,
      bootstrapData,
      addCustomer,
      addProduct,
      addOrder,
    }),
    [
      authReady,
      token,
      user,
      customers,
      products,
      orders,
      loading,
      errors,
      login,
      register,
      logout,
      bootstrapData,
      addCustomer,
      addProduct,
      addOrder,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
