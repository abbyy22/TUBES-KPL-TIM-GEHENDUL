const ApiClient = (() => {
  const DEFAULT_BASE_URL = "http://localhost:3000/api";
  const TOKEN_KEY = "telfood.token";
  const USER_KEY = "telfood.user";
  const API_BASE_KEY = "telfood.apiBaseUrl";

  function getBaseUrl() {
    const configured =
      window.TELFOOD_API_BASE_URL || localStorage.getItem(API_BASE_KEY);
    return (configured || DEFAULT_BASE_URL).replace(/\/$/, "");
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch (err) {
      return null;
    }
  }

  function normalizeRole(role) {
    if (role === "admin" || role === "owner" || role === "penjual")
      return "owner";
    return "siswa";
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
    const inPages = window.location.pathname.includes("/pages/");
    window.location.href = inPages
      ? "../auth/login.html"
      : "./pages/auth/login.html";
  }

  function isTokenExpired(token) {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
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
    const { method = "GET", body, auth = true, headers = {} } = options;

    const requestHeaders = {
      Accept: "application/json",
      ...headers,
    };

    if (body !== undefined) {
      requestHeaders["Content-Type"] = "application/json";
    }

    const token = getToken();
    if (auth) {
      if (token && isTokenExpired(token)) {
        logout();
        throw new Error("Sesi telah berakhir, silakan login kembali");
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
      const message =
        payload?.error?.message || `Request gagal (${response.status})`;
      throw new Error(message);
    }

    return payload?.data ?? payload;
  }

  async function login(email, password) {
    const data = await request("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    saveSession(data);
    return data;
  }

  async function register(full_name, email, password) {
    const data = await request("/auth/register", {
      method: "POST",
      auth: false,
      body: { full_name, email, password },
    });
    saveSession(data);
    return data;
  }

  function getKantins() {
    return request("/kantins");
  }

  function getMenus(params = {}) {
    const query = new URLSearchParams();
    if (params.kantin_id !== undefined)
      query.set("kantin_id", params.kantin_id);
    if (params.available !== undefined)
      query.set("available", String(params.available));
    const suffix = query.toString() ? `?${query}` : "";
    return request(`/menus${suffix}`);
  }

  function getMenuById(id) {
    return request(`/menus/${id}`);
  }

  // ─── Menu CRUD (penjual / admin) ─────────────────────────────────────────────
  function createMenu(menuData) {
    return request("/menus", { method: "POST", body: menuData });
  }

  function updateMenu(id, menuData) {
    return request(`/menus/${id}`, { method: "PUT", body: menuData });
  }

  function deleteMenu(id) {
    return request(`/menus/${id}`, { method: "DELETE" });
  }

  // ─── Orders ──────────────────────────────────────────────────────────────────
  function createOrder(order) {
    return request("/orders", {
      method: "POST",
      body: order,
    });
  }

  function getOrder(id) {
    return request(`/orders/${id}`);
  }

  function listMyOrders() {
    return request("/orders/me");
  }

  async function getMe() {
    const user = await request("/auth/me");
    const current = getUser() || {};
    saveSession({ token: getToken(), user: { ...current, ...user } });
    return user;
  }

  async function updateProfile(profileData) {
    const user = await request("/auth/me", {
      method: "PATCH",
      body: profileData,
    });
    const current = getUser() || {};
    saveSession({ token: getToken(), user: { ...current, ...user } });
    return user;
  }

  /**
   * Upload foto profil ke backend (POST /auth/avatar, multipart/form-data).
   * @param {File} file
   * @returns {Promise<{photo_url: string}>}
   */
  async function uploadAvatar(file) {
    const token = getToken();
    const form = new FormData();
    form.append('photo', file);
    const response = await fetch(`${getBaseUrl()}/auth/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    let payload = null;
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) {
      throw new Error(payload?.error?.message || `Upload gagal (${response.status})`);
    }
    const data = payload?.data ?? payload;
    // Simpan photo_url terbaru ke session
    const current = getUser() || {};
    saveSession({ token, user: { ...current, photo_url: data.photo_url } });
    return data;
  }

  /**
   * Upload foto menu ke backend (POST /menus/:id/photo, multipart/form-data).
   * @param {number|string} menuId
   * @param {File} file
   * @returns {Promise<{photo_url: string}>}
   */
  async function uploadMenuPhoto(menuId, file) {
    const token = getToken();
    const form = new FormData();
    form.append('photo', file);
    const response = await fetch(`${getBaseUrl()}/menus/${menuId}/photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    let payload = null;
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) {
      throw new Error(payload?.error?.message || `Upload foto menu gagal (${response.status})`);
    }
    return payload?.data ?? payload;
  }

  async function deleteMenuPhoto(menuId) {
    return request(`/menus/${menuId}/photo`, { method: 'DELETE' });
  }

  function listAllOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.kantin_id) query.set("kantin_id", params.kantin_id);
    const suffix = query.toString() ? `?${query}` : "";
    return request(`/orders${suffix}`);
  }

  function getOrderByKantin(kantinId) {
    return request(`/orders/kantin/${kantinId}`);
  }

  function updateOrderStatus(id, status) {
    return request(`/orders/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  }

  return {
    clearSession,
    createMenu,
    createOrder,
    deleteMenu,
    deleteMenuPhoto,
    getBaseUrl,
    getKantins,
    getMenuById,
    getMenus,
    getMe,
    getOrder,
    getOrderByKantin,
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
    updateMenu,
    updateOrderStatus,
    updateProfile,
    uploadAvatar,
    uploadMenuPhoto,
  };
})();

window.ApiClient = ApiClient;
