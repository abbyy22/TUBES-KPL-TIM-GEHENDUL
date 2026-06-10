/**
 * account.js
 *
 * Mengelola halaman Profil — dua varian:
 *  - AccountPage.init()       → profil Siswa/Pelanggan (foto, edit data, riwayat, notifikasi)
 *  - AccountPage.initOwner()  → profil Owner/Penjual  (foto, edit data, info kantin, statistik)
 *
 * Teknik: Parameterization (initProfileForm/initPhotoPicker dipakai keduanya),
 *         Code reuse (shared helpers formatRp, formatDate, getAvatarUrl, dll.)
 */
const AccountPage = (() => {
  // ─── Konstanta ──────────────────────────────────────────────────────────────
  const NOTIFICATIONS_KEY = "telfood.notifications";
  const GRAY_PERSON_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af' style='background-color:%23e5e7eb;'><path fill-rule='evenodd' d='M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z' clip-rule='evenodd' /></svg>";

  // ══════════════════════════════════════════════════════════════════════════════
  // SHARED HELPERS
  // ══════════════════════════════════════════════════════════════════════════════

  // ─── Notifikasi ─────────────────────────────────────────────────────────────
  function getNotifications() {
    try { return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]"); }
    catch (_) { return []; }
  }

  function saveNotifications(list) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list.slice(0, 20)));
  }

  function addNotification(notification) {
    const list = getNotifications();
    saveNotifications([{ id: Date.now(), read: false, ...notification }, ...list]);
  }

  // ─── Formatters ─────────────────────────────────────────────────────────────
  function formatRp(n) {
    return "Rp " + Number(n || 0).toLocaleString("id-ID");
  }

  function formatDate(val) {
    if (!val) return "";
    const d = new Date(val);
    return Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
  }

  // ─── Foto Profil ─────────────────────────────────────────────────────────────
  function syncProfilePhoto() {
    const user = ApiClient.getUser();
    const role = ApiClient.normalizeRole(user?.role);
    const url = role === "owner" ? GRAY_PERSON_SVG : (user?.photo_url || GRAY_PERSON_SVG);

    const profileImg = document.getElementById("profile-photo");
    const sidebarAvatar = document.getElementById("sidebar-avatar");
    if (profileImg) profileImg.src = url;
    if (sidebarAvatar) sidebarAvatar.src = url;
  }

  /**
   * Inisialisasi tombol Edit Foto — shared antara siswa & owner.
   * Upload ke backend; preview lokal dulu sebelum upload selesai.
   */
  function initPhotoPicker() {
    const btn = document.getElementById("edit-photo-btn");
    const input = document.getElementById("profile-photo-input");
    const msg = document.getElementById("profile-message");
    if (!btn || !input) return;

    btn.addEventListener("click", () => input.click());

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Preview lokal dulu (responsif)
      const reader = new FileReader();
      reader.onload = () => {
        const profileImg = document.getElementById("profile-photo");
        const sidebarAvatar = document.getElementById("sidebar-avatar");
        if (profileImg) profileImg.src = reader.result;
        if (sidebarAvatar) sidebarAvatar.src = reader.result;
      };
      reader.readAsDataURL(file);

      if (!ApiClient.isAuthenticated()) return;

      const originalHTML = btn.innerHTML;
      btn.innerHTML = `
        <svg class="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
        </svg>
      `;
      btn.disabled = true;
      try {
        await ApiClient.uploadAvatar(file);
        syncProfilePhoto();
        if (msg) { msg.textContent = "Foto profil berhasil diperbarui."; msg.style.color = "#16a34a"; }
      } catch (err) {
        if (msg) { msg.textContent = "Gagal upload foto: " + err.message; msg.style.color = "#ef4444"; }
      } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }
    });
  }

  /**
   * Inisialisasi form edit profil (nama + password) — shared antara siswa & owner.
   */
  function initProfileForm(user) {
    const nameInput = document.getElementById("profile-name-input");
    const emailInput = document.getElementById("profile-email-input");
    const form = document.getElementById("profile-form");
    const message = document.getElementById("profile-message");

    if (nameInput) nameInput.value = user?.name || "";
    if (emailInput) emailInput.value = user?.email || "";

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!ApiClient.isAuthenticated()) return;

      const name = nameInput?.value.trim();
      const curPassword = document.getElementById("current-password")?.value;
      const newPassword = document.getElementById("new-password")?.value;

      if (!name && !newPassword) {
        if (message) { message.textContent = "Isi nama atau password baru untuk menyimpan."; message.style.color = "#ef4444"; }
        return;
      }

      const payload = {};
      if (name) payload.name = name;
      if (newPassword) {
        payload.current_password = curPassword || "";
        payload.new_password = newPassword;
      }

      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Menyimpan..."; }

      try {
        const updated = await ApiClient.updateProfile(payload);
        const sidebarName = document.getElementById("sidebar-user-name");
        if (sidebarName) sidebarName.textContent = updated.name || user?.name;
        if (nameInput) nameInput.value = updated.name || "";
        if (emailInput) emailInput.value = updated.email || "";
        if (document.getElementById("current-password")) document.getElementById("current-password").value = "";
        if (document.getElementById("new-password")) document.getElementById("new-password").value = "";
        if (message) { message.textContent = "✓ Profil berhasil diperbarui."; message.style.color = "#16a34a"; }
      } catch (err) {
        if (message) { message.textContent = err.message; message.style.color = "#ef4444"; }
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Simpan perubahan"; }
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SISWA — Riwayat Pesanan & Notifikasi
  // ══════════════════════════════════════════════════════════════════════════════

  function renderHistory(orders) {
    const container = document.getElementById("history-container");
    if (!container) return;

    // Update badge count
    const countBadge = document.getElementById("history-count-badge");
    if (countBadge) {
      const count = orders ? orders.length : 0;
      countBadge.textContent = count + " pesanan";
      countBadge.style.background = count > 0 ? "rgba(192,90,31,0.10)" : "rgba(0,0,0,0.05)";
      countBadge.style.color = count > 0 ? "#C05A1F" : "#9E8E84";
    }

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;">
          <div style="width:72px;height:72px;background:linear-gradient(135deg,#FEF3EC,#FDDFC4);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C05A1F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <p style="font-size:15px;font-weight:700;color:#6B5E54;margin:0 0 6px;">Belum ada riwayat pesanan</p>
          <p style="font-size:12px;color:#9E8E84;margin:0;">Pesanan kamu hari ini akan muncul di sini</p>
        </div>`;
      return;
    }

    container.innerHTML = orders.map((order, idx) => renderOrderCard(order, idx)).join("");
  }

  async function loadHistory() {
    // Retry fallback: DOM may not be ready yet when called from SPA router.
    let container = document.getElementById("history-container");
    if (!container) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        await new Promise((r) => setTimeout(r, 300));
        container = document.getElementById("history-container");
        if (container) break;
      }
    }
    console.log("[AccountPage] loadHistory() container:", container);
    if (!container) return [];

    container.innerHTML = '<p class="text-sm text-gray-400 italic text-center py-8 animate-pulse">Memuat riwayat...</p>';
    if (!ApiClient.isAuthenticated()) {
      container.innerHTML = '<p class="text-sm text-gray-400 italic text-center py-8">Login untuk melihat riwayat</p>';
      return [];
    }

    try {
      const allOrders = await ApiClient.listMyOrders();
      console.log("[AccountPage] loadHistory() API returned allOrders:", allOrders);
      
      if (!allOrders || !Array.isArray(allOrders)) {
        console.warn("[AccountPage] loadHistory() invalid response:", allOrders);
        container.innerHTML = '<p class="text-sm text-gray-400 italic text-center py-8">Gagal memuat riwayat: data tidak valid</p>';
        return [];
      }
      
      renderHistory(allOrders);
      return allOrders;
    } catch (err) {
      console.error("[AccountPage] ApiClient.listMyOrders() failed:", err);
      container.innerHTML = `<p class="text-sm text-red-400 italic text-center py-8">Gagal memuat riwayat: ${err.message}</p>`;
      return [];
    }
  }

  function renderNotifications() {
    const container = document.getElementById("notification-list");
    const badge = document.getElementById("notification-badge");
    if (!container) return;

    const notifications = getNotifications();
    const unread = notifications.filter((n) => !n.read).length;
    if (badge) {
      badge.textContent = unread > 9 ? "9+" : String(unread);
      badge.classList.toggle("hidden", unread === 0);
    }

    renderCollection(
      container,
      notifications,
      (item) => `
      <div class="bg-white rounded-xl p-3 border border-orange-100">
        <p class="text-sm font-semibold text-gray-800">${item.title || "Notifikasi"}</p>
        <p class="text-xs text-gray-500 mt-1">${item.message || "Ada pembaruan pesanan."}</p>
      </div>`,
      '<p class="text-sm text-gray-400 italic text-center py-4">Belum ada notifikasi</p>',
    );
  }

  /**
   * Init halaman Profil SISWA.
   * Berisi: foto, edit profil, riwayat pesanan, notifikasi.
   */
  async function init() {
    let user = ApiClient.getUser();
    let orders = [];

    // Refresh user data from server to ensure latest info
    try {
      user = await ApiClient.getMe();
    } catch (err) {
      console.warn('[AccountPage] Gagal refresh user data:', err);
    }

    syncProfilePhoto();
    initPhotoPicker();
    initProfileForm(user);
    renderNotifications();

    try {
      orders = await loadHistory();
    } catch (err) {
      const container = document.getElementById("history-container");
      if (container)
        container.innerHTML = `<p class="text-sm text-red-400 italic text-center py-8">Gagal memuat riwayat: ${err.message}</p>`;
    }

    // Pencarian riwayat
    document.getElementById("search")?.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase();
      const filtered = keyword
        ? orders.filter(
          (o) =>
            String(o.id).includes(keyword) ||
            (o.items || []).some((it) => it.menu_name.toLowerCase().includes(keyword)),
        )
        : orders;
      renderHistory(filtered);
    });

    // Panel notifikasi
    document.getElementById("notification-btn")?.addEventListener("click", () => {
      document.getElementById("notification-panel")?.classList.toggle("hidden");
      saveNotifications(getNotifications().map((n) => ({ ...n, read: true })));
      renderNotifications();
    });

    // Tutup notifikasi klik di luar
    document.addEventListener("click", (e) => {
      const panel = document.getElementById("notification-panel");
      const btn = document.getElementById("notification-btn");
      if (panel && !panel.contains(e.target) && e.target !== btn && !btn?.contains(e.target)) {
        panel.classList.add("hidden");
      }
    }, { capture: true });
  }

  // ── Shared card renderer — dipakai oleh user & owner ─────────────────────────
  function renderOrderCard(order, idx) {
    idx = idx || 0;
    // Escape HTML aman (tidak bergantung pada Utils global)
    function esc(s) {
      return String(s || '').replace(/[<>&"']/g, function (c) {
        return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    // Status badge
    var status = (order.status || '').toUpperCase();
    var statusConfig = {
      'ORDERED': { label: '⏳ Dipesan', bg: '#FEF9C3', color: '#CA8A04', border: '#FDE68A' },
      'PENDING': { label: '⏳ Dipesan', bg: '#FEF9C3', color: '#CA8A04', border: '#FDE68A' },
      'COOKING': { label: '🍳 Dimasak', bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' },
      'PROCESS': { label: '🍳 Dimasak', bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' },
      'READY': { label: '🔔 Siap Diambil', bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
      'DONE': { label: '✓ Selesai', bg: '#DCFCE7', color: '#16A34A', border: '#BBF7D0' },
      'CANCELLED': { label: '✕ Dibatalkan', bg: '#F5F5F5', color: '#737373', border: '#E5E7EB' },
    };
    var sc = statusConfig[status] || { label: status || 'Baru', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };

    // Tanggal & waktu
    var d = new Date(order.created_at);
    var isValid = !isNaN(d.getTime());
    var formattedDate = isValid ? d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';

    // Fields
    var kantinName = esc(order.kantin_name || 'Kantin');
    var totalNum = Number(order.total_price || 0);
    var totalStr = 'Rp ' + totalNum.toLocaleString('id-ID');
    var delay = (idx * 60) + 'ms';

    // Items section: simplified - just show item count and names
    var items = Array.isArray(order.items) ? order.items : [];
    var itemSummary = items.length
      ? items.map(function (it) {
          return esc(it.quantity) + 'x ' + esc(it.menu_name);
        }).join(', ')
      : 'Detail tidak tersedia';

    // Card
    return '<div style="background:#fff;border-radius:12px;border:1px solid #EDE5D8;padding:12px 14px;'
      + 'transition:box-shadow 0.2s,transform 0.2s;animation:fadeUp 0.35s ease both;animation-delay:' + delay + ';" '
      + 'onmouseenter="this.style.boxShadow=\'0 4px 12px rgba(192,90,31,0.1)\';this.style.transform=\'translateY(-1px)\'" '
      + 'onmouseleave="this.style.boxShadow=\'none\';this.style.transform=\'none\'">'

      // Card body
      + '<div style="display:flex;flex-direction:column;gap:8px;">'

        // Header row: kantin name + status badge
        + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">'
          + '<span style="font-size:13px;font-weight:600;color:#1F2937;">' + kantinName + '</span>'
          + '<span style="flex-shrink:0;font-size:9px;font-weight:600;padding:3px 8px;border-radius:12px;'
          + 'background:' + sc.bg + ';color:' + sc.color + ';border:1px solid ' + sc.border + ';white-space:nowrap;">'
          + sc.label + '</span>'
        + '</div>'

        // Items summary
        + '<div style="font-size:12px;color:#4B5563;line-height:1.4;">' + itemSummary + '</div>'

        // Footer: date + total
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px;">'
          + '<span style="font-size:10px;color:#9E8E84;">' + formattedDate + '</span>'
          + '<span style="font-size:14px;font-weight:700;color:#C05A1F;">' + totalStr + '</span>'
        + '</div>'

      + '</div>'
    + '</div>';
  }

  // ── Owner-specific card renderer (riwayat penjualan) ──────────────────────────
  function renderOwnerOrderCard(order, idx) {
    idx = idx || 0;
    // Escape HTML aman (tidak bergantung pada Utils global)
    function esc(s) {
      return String(s || '').replace(/[<>&"']/g, function (c) {
        return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    // Status badge
    var status = (order.status || '').toUpperCase();
    var statusConfig = {
      'ORDERED': { label: '⏳ Dipesan', bg: '#FEF9C3', color: '#CA8A04', border: '#FDE68A' },
      'PENDING': { label: '⏳ Dipesan', bg: '#FEF9C3', color: '#CA8A04', border: '#FDE68A' },
      'COOKING': { label: '🍳 Dimasak', bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' },
      'PROCESS': { label: '🍳 Dimasak', bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' },
      'READY': { label: '🔔 Siap Diambil', bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
      'DONE': { label: '✓ Selesai', bg: '#DCFCE7', color: '#16A34A', border: '#BBF7D0' },
      'CANCELLED': { label: '✕ Dibatalkan', bg: '#F5F5F5', color: '#737373', border: '#E5E7EB' },
    };
    var sc = statusConfig[status] || { label: status || 'Baru', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };

    // Tanggal & waktu
    var d = new Date(order.created_at);
    var isValid = !isNaN(d.getTime());
    var formattedDate = isValid ? d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';

    // Fields
    var customerName = esc(order.customer_name || 'Pelanggan');
    var kantinName   = esc(order.kantin_name || '');
    var orderId      = String(order.id || '').slice(-6) || '—';
    var totalNum     = Number(order.total_price || 0);
    var totalStr     = 'Rp ' + totalNum.toLocaleString('id-ID');
    var delay        = (idx * 60) + 'ms';

    // Items section: simplified - just show item count and names
    var items = Array.isArray(order.items) ? order.items : [];
    var itemSummary = items.length
      ? items.map(function (it) {
          return esc(it.quantity) + 'x ' + esc(it.menu_name);
        }).join(', ')
      : 'Detail tidak tersedia';

    // Card
    return '<div style="background:#fff;border-radius:12px;border:1px solid #EDE5D8;padding:12px 14px;'
      + 'transition:box-shadow 0.2s,transform 0.2s;animation:fadeUp 0.35s ease both;animation-delay:' + delay + ';" '
      + 'onmouseenter="this.style.boxShadow=\'0 4px 12px rgba(192,90,31,0.1)\';this.style.transform=\'translateY(-1px)\'" '
      + 'onmouseleave="this.style.boxShadow=\'none\';this.style.transform=\'none\'">'

      // Card body
      + '<div style="display:flex;flex-direction:column;gap:8px;">'

        // Header row: customer name + status badge
        + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">'
          + '<span style="font-size:13px;font-weight:600;color:#1F2937;">' + customerName + '</span>'
          + '<span style="flex-shrink:0;font-size:9px;font-weight:600;padding:3px 8px;border-radius:12px;'
          + 'background:' + sc.bg + ';color:' + sc.color + ';border:1px solid ' + sc.border + ';white-space:nowrap;">'
          + sc.label + '</span>'
        + '</div>'

        // Items summary
        + '<div style="font-size:12px;color:#4B5563;line-height:1.4;">' + itemSummary + '</div>'

        // Footer: date + total
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px;">'
          + '<span style="font-size:10px;color:#9E8E84;">' + formattedDate + '</span>'
          + '<span style="font-size:14px;font-weight:700;color:#C05A1F;">' + totalStr + '</span>'
        + '</div>'

      + '</div>'
    + '</div>';
  }

  function fillEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "—";
  }

  function renderOwnerOrders(orders) {
    const container = document.getElementById("today-orders-container");
    if (!container) return;

    // Update badge count
    const badge = document.getElementById("today-orders-count-badge");
    if (badge) {
      badge.textContent = `${orders.length} transaksi`;
      badge.style.background = orders.length > 0 ? 'rgba(192,90,31,0.12)' : 'rgba(0,0,0,0.05)';
      badge.style.color = orders.length > 0 ? '#C05A1F' : '#9E8E84';
    }

    if (orders.length === 0) {
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 20px;text-align:center;">
          <div style="width:68px;height:68px;background:linear-gradient(135deg,#FEF3EC,#FDDFC4);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:14px;">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C05A1F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <p style="font-size:15px;font-weight:700;color:#6B5E54;margin:0 0 6px;">Belum ada pesanan masuk</p>
          <p style="font-size:12px;color:#9E8E84;margin:0;">Semua transaksi pesanan masuk akan muncul di sini secara real-time</p>
        </div>`;
      return;
    }

    container.innerHTML = orders.map((order, idx) => renderOwnerOrderCard(order, idx)).join("");
  }

  async function loadOwnerStats(kantinId) {
    if (!kantinId) return;

    // Retry fallback: DOM may not be ready yet when called from SPA router.
    let container = document.getElementById("today-orders-container");
    if (!container) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        await new Promise((r) => setTimeout(r, 300));
        container = document.getElementById("today-orders-container");
        if (container) break;
      }
    }
    console.log("[AccountPage] loadOwnerStats() container:", container);

    try {
      const orders = await ApiClient.getOrderByKantin(kantinId);

      // Statistik Semua Waktu
      const done = orders.filter((o) => o.status === "DONE").length;

      fillEl("stat-done-orders", done);

      // Statistik & Riwayat Harian
      const todayStr = new Date().toDateString();
      const todayOrdersSummaries = orders.filter((o) => {
        const orderDate = new Date(o.created_at).toDateString();
        return orderDate === todayStr;
      });

      const todayRevenue = todayOrdersSummaries
        .filter((o) => o.status === "DONE")
        .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

      fillEl("stat-today-revenue", formatRp(todayRevenue));
      fillEl("stat-today-orders", todayOrdersSummaries.length);

      renderOwnerOrders(orders);
    } catch (err) {
      console.warn("[AccountPage] Gagal load statistik owner:", err.message);
      if (container) container.innerHTML = `<p class="text-xs text-red-400 italic text-center py-8">Gagal memuat data. Pastikan server berjalan.</p>`;
    }
  }

  /**
   * Init halaman Profil OWNER.
   * Berisi: foto, edit profil, info kantin, statistik ringkasan.
   */
  async function initOwner() {
    let user = ApiClient.getUser();

    // Refresh user data from server to ensure latest info
    try {
      user = await ApiClient.getMe();
    } catch (err) {
      console.warn('[AccountPage] Gagal refresh user data:', err);
    }

    syncProfilePhoto();
    initProfileForm(user);

    // Isi header kantin baru
    fillEl("kantin-name-display", user?.kantin_name || "—");
    fillEl("kantin-code-display", user?.kantin_code ? `Kode: ${user.kantin_code}` : "");

    // Isi label tanggal hari ini
    const dateEl = document.getElementById("today-date-label");
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    // Load statistik & daftar transaksi harian
    await loadOwnerStats(user?.kantin_id);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════════════
  return {
    addNotification,
    init,
    initOwner,
    renderNotifications,
    syncProfilePhoto,
  };
})();

window.AccountPage = AccountPage;
window.initAccountPage = AccountPage.init;
