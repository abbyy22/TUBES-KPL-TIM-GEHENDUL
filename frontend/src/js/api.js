const ApiClient = (() => {
  const DEFAULT_BASE_URL = 'http://localhost:3000/api';
  const TOKEN_KEY = 'telfood.token';
  const USER_KEY = 'telfood.user';
  const API_BASE_KEY = 'telfood.apiBaseUrl';

  function getBaseUrl() {
    const configured = window.TELFOOD_API_BASE_URL || localStorage.getItem(API_BASE_KEY);
    return (configured || DEFAULT_BASE_URL).replace(/\/$/, '');
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch (err) {
      return null;
    }
  }

  function normalizeRole(role) {
    if (role === 'admin' || role === 'owner') return 'owner';
    return 'siswa';
  }

  function saveSession(data) {
    if (!data || !data.token || !data.user) return;
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isAuthenticated() {
    return Boolean(getToken());
  }

  async function request(path, options = {}) {
    const {
      method = 'GET',
      body,
      auth = true,
      headers = {},
    } = options;

    const requestHeaders = {
      Accept: 'application/json',
      ...headers,
    };

    if (body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const token = getToken();
    if (auth && token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${getBaseUrl()}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (err) {
      payload = null;
    }

    if (!response.ok) {
      const message = payload?.error?.message || `Request gagal (${response.status})`;
      throw new Error(message);
    }

    return payload?.data ?? payload;
  }

  async function login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    });
    saveSession(data);
    return data;
  }

  async function register(name, email, password) {
    const data = await request('/auth/register', {
      method: 'POST',
      auth: false,
      body: { name, email, password },
    });
    saveSession(data);
    return data;
  }

  function getKantins() {
    return request('/kantins');
  }

  function getMenus(params = {}) {
    const query = new URLSearchParams();
    if (params.kantin_id !== undefined) query.set('kantin_id', params.kantin_id);
    if (params.available !== undefined) query.set('available', String(params.available));
    const suffix = query.toString() ? `?${query}` : '';
    return request(`/menus${suffix}`);
  }

  function createOrder(order) {
    return request('/orders', {
      method: 'POST',
      body: order,
    });
  }

  function getOrder(id) {
    return request(`/orders/${id}`);
  }

  function listMyOrders() {
    return request('/orders/me');
  }

  function listAllOrders() {
    return request('/orders');
  }

  function updateOrderStatus(id, status) {
    return request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  }

  return {
    clearSession,
    createOrder,
    getBaseUrl,
    getKantins,
    getMenus,
    getOrder,
    getToken,
    getUser,
    isAuthenticated,
    listAllOrders,
    listMyOrders,
    login,
    normalizeRole,
    register,
    saveSession,
    updateOrderStatus,
  };
})();

window.ApiClient = ApiClient;
