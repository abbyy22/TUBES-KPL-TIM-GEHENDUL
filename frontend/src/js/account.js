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

    const profileImg    = document.getElementById("profile-photo");
    const sidebarAvatar = document.getElementById("sidebar-avatar");
    if (profileImg)    profileImg.src    = url;
    if (sidebarAvatar) sidebarAvatar.src = url;
  }

  /**
   * Inisialisasi tombol Edit Foto — shared antara siswa & owner.
   * Upload ke backend; preview lokal dulu sebelum upload selesai.
   */
  function initPhotoPicker() {
    const btn   = document.getElementById("edit-photo-btn");
    const input = document.getElementById("profile-photo-input");
    const msg   = document.getElementById("profile-message");
    if (!btn || !input) return;

    btn.addEventListener("click", () => input.click());

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Preview lokal dulu (responsif)
      const reader = new FileReader();
      reader.onload = () => {
        const profileImg    = document.getElementById("profile-photo");
        const sidebarAvatar = document.getElementById("sidebar-avatar");
        if (profileImg)    profileImg.src    = reader.result;
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
        btn.disabled  = false;
      }
    });
  }

  /**
   * Inisialisasi form edit profil (nama + password) — shared antara siswa & owner.
   */
  function initProfileForm(user) {
    const nameInput  = document.getElementById("profile-name-input");
    const emailInput = document.getElementById("profile-email-input");
    const form       = document.getElementById("profile-form");
    const message    = document.getElementById("profile-message");

    if (nameInput)  nameInput.value  = user?.name  || "";
    if (emailInput) emailInput.value = user?.email || "";

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!ApiClient.isAuthenticated()) return;

      const name        = nameInput?.value.trim();
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
        payload.new_password     = newPassword;
      }

      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Menyimpan..."; }

      try {
        const updated = await ApiClient.updateProfile(payload);
        const sidebarName = document.getElementById("sidebar-user-name");
        if (sidebarName) sidebarName.textContent = updated.name || user?.name;
        if (nameInput)  nameInput.value  = updated.name  || "";
        if (emailInput) emailInput.value = updated.email || "";
        if (document.getElementById("current-password")) document.getElementById("current-password").value = "";
        if (document.getElementById("new-password"))     document.getElementById("new-password").value     = "";
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

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <svg class="w-14 h-14 text-gray-200 mb-4" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p class="text-sm font-semibold text-gray-400">Belum ada riwayat pesanan</p>
          <p class="text-xs text-gray-300 mt-1">Pesanan kamu akan muncul di sini</p>
        </div>`;
      return;
    }

    container.innerHTML = orders.map((order) => renderOrderCard(order)).join("");
  }

  async function loadHistory() {
    const container = document.getElementById("history-container");
    if (!container) return [];

    container.innerHTML = '<p class="text-sm text-gray-400 italic text-center py-8 animate-pulse">Memuat riwayat...</p>';
    if (!ApiClient.isAuthenticated()) {
      container.innerHTML = '<p class="text-sm text-gray-400 italic text-center py-8">Login untuk melihat riwayat</p>';
      return [];
    }

    const allOrders = await ApiClient.listMyOrders();
    const todayStr = new Date().toDateString();
    const todayOrders = allOrders.filter((o) => {
      const orderDate = new Date(o.created_at).toDateString();
      return orderDate === todayStr;
    });

    renderHistory(todayOrders);
    return todayOrders;
  }

  function renderNotifications() {
    const container = document.getElementById("notification-list");
    const badge     = document.getElementById("notification-badge");
    if (!container) return;

    const notifications = getNotifications();
    const unread        = notifications.filter((n) => !n.read).length;
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
    const user = ApiClient.getUser();
    let orders = [];

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
      const btn   = document.getElementById("notification-btn");
      if (panel && !panel.contains(e.target) && e.target !== btn && !btn?.contains(e.target)) {
        panel.classList.add("hidden");
      }
    }, { capture: true });
  }

  // ── Shared card renderer — dipakai oleh user & owner ─────────────────────────
  function renderOrderCard(order) {
    // Escape HTML aman (tidak bergantung pada Utils global)
    function esc(s) {
      return String(s || '').replace(/[<>&"']/g, function(c) {
        return { '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&#39;' }[c];
      });
    }

    // Items sebagai baris teks biasa
    const itemLines = Array.isArray(order.items) && order.items.length
      ? order.items.map(function(it) {
          return '<p style="font-size:14px;color:#1f2937;margin:2px 0;">' + esc(it.quantity) + 'x ' + esc(it.menu_name) + '</p>';
        }).join('')
      : '<p style="font-size:12px;color:#9ca3af;font-style:italic;">Detail tidak tersedia</p>';

    // Tanggal format panjang (Rabu, 25 April 2026)
    var d = new Date(order.created_at);
    var tglStr = isNaN(d.getTime()) ? '—' : d.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    // Harga
    var totalStr = 'Rp. ' + Number(order.total_price || 0).toLocaleString('id-ID');
    var kantinName = esc(order.kantin_name || 'Kantin');

    return '<div style="background:#fff;border-radius:12px;border:1px solid #E8E0D5;padding:16px 20px;margin-bottom:0;transition:box-shadow 0.15s;">'
      + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">'
        + '<div style="flex:1;min-width:0;">' + itemLines + '</div>'
        + '<div style="text-align:right;flex-shrink:0;">'
          + '<p style="font-size:14px;font-weight:700;color:#1f2937;margin:0;">' + kantinName + '</p>'
          + '<p style="font-size:11px;color:#9ca3af;margin:2px 0 0;">' + esc(tglStr) + '</p>'
        + '</div>'
      + '</div>'
      + '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #f3f4f6;display:flex;align-items:center;gap:4px;">'
        + '<span style="font-size:11px;color:#9ca3af;">total: </span>'
        + '<span style="font-size:14px;font-weight:700;color:#1f2937;">' + totalStr + '</span>'
      + '</div>'
    + '</div>';
  }


  function fillEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "—";
  }

  function renderOwnerTodayOrders(orders) {
    const container = document.getElementById("today-orders-container");
    if (!container) return;

    // Update badge count
    const badge = document.getElementById("today-orders-count-badge");
    if (badge) badge.textContent = `${orders.length} transaksi`;

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-14 text-center">
          <svg class="w-12 h-12 text-gray-200 mb-3" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p class="text-sm font-semibold text-gray-400">Belum ada transaksi hari ini</p>
          <p class="text-xs text-gray-300 mt-1">Order masuk akan muncul di sini secara real-time</p>
        </div>`;
      return;
    }

    container.innerHTML = orders.map((order) => renderOrderCard(order)).join("");
  }

  async function loadOwnerStats(kantinId) {
    if (!kantinId) return;
    try {
      const orders = await ApiClient.getOrderByKantin(kantinId);

      // Statistik Semua Waktu
      const done    = orders.filter((o) => o.status === "DONE").length;

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
      fillEl("stat-today-orders",  todayOrdersSummaries.length);

      renderOwnerTodayOrders(todayOrdersSummaries);
    } catch (err) {
      console.warn("[AccountPage] Gagal load statistik owner:", err.message);
      const container = document.getElementById("today-orders-container");
      if (container) container.innerHTML = `<p class="text-xs text-red-400 italic text-center py-8">Gagal memuat data. Pastikan server berjalan.</p>`;
    }
  }

  /**
   * Init halaman Profil OWNER.
   * Berisi: foto, edit profil, info kantin, statistik ringkasan.
   */
  async function initOwner() {
    const user = ApiClient.getUser();

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
