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

  /**
   * normalizeRole – maps raw DB role → frontend role group.
   * DB roles:   'user'     → 'siswa'  (pelanggan)
   *             'penjual'  → 'owner'  (admin kantin)
   *             'admin'    → 'owner'
   *             'owner'    → 'owner'
   *             'pelanggan'→ 'siswa'  (legacy)
   */
  function normalizeRole(role) {
    if (role === 'admin' || role === 'owner' || role === 'penjual') return 'owner';
    // 'user', 'pelanggan', or any other → siswa
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

  function logout() {
    clearSession();
    // Redirect to login based on current path depth
    const inPages = window.location.pathname.includes('/pages/');
    window.location.href = inPages ? '../auth/login.html' : './pages/auth/login.html';
  }

  function isTokenExpired(token) {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp < now;
    } catch (e) {
      return true;
    }
  }

  function isAuthenticated() {
    const token = getToken();
    if (!token) return false;

    if (isTokenExpired(token)) {
      clearSession();
      return false;
    }
    return true;
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
    if (auth) {
      if (token && isTokenExpired(token)) {
        logout();
        throw new Error('Sesi telah berakhir, silakan login kembali');
      }
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
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

  /**
   * register – sends full_name (not name) to match backend Joi validator.
   * Role is always forced to 'user' by backend; no need to send it.
   */
  async function register(full_name, email, password) {
    const data = await request('/auth/register', {
      method: 'POST',
      auth: false,
      body: { full_name, email, password },
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
    logout,
    normalizeRole,
    register,
    saveSession,
    updateOrderStatus,
  };
})();

window.ApiClient = ApiClient;
