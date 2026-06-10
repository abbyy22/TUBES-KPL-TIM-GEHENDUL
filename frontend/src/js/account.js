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

    renderCollection(
      container,
      orders,
      (order) => {
        const itemsHtml =
          Array.isArray(order.items) && order.items.length
            ? order.items
                .map((it) => `<p class="text-sm text-gray-700">${it.quantity}x <span class="font-medium">${it.menu_name}</span></p>`)
                .join("")
            : `<p class="text-sm text-gray-700">Pesanan #${order.id}</p>`;

        const meta  = getOrderStatusMeta(order.status);
        const color = meta.color;

        return `
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-[#C1500E] transition-colors">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">${itemsHtml}</div>
            <div class="text-right shrink-0">
              <p class="text-xs text-gray-400 mt-0.5">${formatDate(order.created_at)}</p>
              <span class="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style="color:${color};background:${color}18">${meta.label}</span>
            </div>
          </div>
          <div class="flex justify-between mt-3 pt-3 border-t border-gray-100">
            <span class="text-xs text-gray-400 font-mono">#${order.id}</span>
            <span class="text-xs font-bold text-[#C1500E]">${formatRp(order.total_price)}</span>
          </div>
        </div>`;
      },
      '<p class="text-sm text-gray-400 italic text-center py-8">Belum ada riwayat pesanan</p>',
    );
  }

  async function loadHistory() {
    const container = document.getElementById("history-container");
    if (!container) return [];

    container.innerHTML = '<p class="text-sm text-gray-400 italic text-center py-8 animate-pulse">Memuat riwayat...</p>';
    if (!ApiClient.isAuthenticated()) {
      container.innerHTML = '<p class="text-sm text-gray-400 italic text-center py-8">Login untuk melihat riwayat</p>';
      return [];
    }

    const summaries = await ApiClient.listMyOrders();
    const orders    = await Promise.all(
      summaries.map((o) => ApiClient.getOrder(o.id).catch(() => o)),
    );
    renderHistory(orders);
    return orders;
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

  // ══════════════════════════════════════════════════════════════════════════════
  // OWNER — Info Kantin & Statistik
  // ══════════════════════════════════════════════════════════════════════════════

  function fillEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "—";
  }

  async function loadOwnerStats(kantinId) {
    if (!kantinId) return;
    try {
      const orders = await ApiClient.listAllOrders({ kantin_id: kantinId });

      const active  = orders.filter((o) => o.status !== "DONE").length;
      const done    = orders.filter((o) => o.status === "DONE").length;
      const revenue = orders
        .filter((o) => o.status === "DONE")
        .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

      fillEl("stat-total-orders",  orders.length);
      fillEl("stat-active-orders", active);
      fillEl("stat-done-orders",   done);
      fillEl("stat-total-revenue", formatRp(revenue));
    } catch (err) {
      console.warn("[AccountPage] Gagal load statistik owner:", err.message);
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

    // Isi info kantin
    fillEl("kantin-name-display", user?.kantin_name || "—");
    fillEl("kantin-code-display", user?.kantin_code || "—");
    fillEl("owner-role-display",  user?.role || "—");

    // Load statistik
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
