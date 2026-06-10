const AccountPage = (() => {
  const PROFILE_PHOTO_KEY = "telfood.profilePhoto";
  const NOTIFICATIONS_KEY = "telfood.notifications";
  const DEFAULT_AVATAR = "./assets/profile.png";

  function getNotifications() {
    try {
      return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    } catch (err) {
      return [];
    }
  }

  function saveNotifications(notifications) {
    localStorage.setItem(
      NOTIFICATIONS_KEY,
      JSON.stringify(notifications.slice(0, 20)),
    );
  }

  function addNotification(notification) {
    const notifications = getNotifications();
    saveNotifications([
      { id: Date.now(), read: false, ...notification },
      ...notifications,
    ]);
  }

  function formatRp(n) {
    return "Rp " + Number(n || 0).toLocaleString("id-ID");
  }

  function formatDate(val) {
    if (!val) return "";
    const d = new Date(val);
    return Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "—";
  }

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
                .map(
                  (it) =>
                    `<p class="text-sm text-gray-700">${it.quantity}x <span class="font-medium">${it.menu_name}</span></p>`,
                )
                .join("")
            : `<p class="text-sm text-gray-700">Pesanan #${order.id}</p>`;
        const meta = getOrderStatusMeta(order.status);
        const color = meta.color;

        return `
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-[#C1500E] transition-colors">
          <div class="flex items-start justify-between gap-4">
            <div>${itemsHtml}</div>
            <div class="text-right">
              <p class="text-xs text-gray-400 mt-0.5">${formatDate(order.created_at)}</p>
              <span class="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full" style="color:${color};background:${color}15">${meta.label}</span>
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

  function renderNotifications() {
    const container = document.getElementById("notification-list");
    const badge = document.getElementById("notification-badge");
    if (!container) return;

    const notifications = getNotifications();
    const unreadCount = notifications.filter((item) => !item.read).length;
    if (badge) {
      badge.textContent = unreadCount;
      badge.classList.toggle("hidden", unreadCount === 0);
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

  function syncProfilePhoto() {
    const photo = localStorage.getItem(PROFILE_PHOTO_KEY) || DEFAULT_AVATAR;
    const img = document.getElementById("profile-photo");
    if (img) img.src = photo;
    const sidebarAvatar = document.getElementById("sidebar-avatar");
    if (sidebarAvatar) sidebarAvatar.src = photo;
  }

  function initProfileForm(user) {
    const nameInput = document.getElementById("profile-name-input");
    const emailInput = document.getElementById("profile-email-input");
    const form = document.getElementById("profile-form");
    const message = document.getElementById("profile-message");

    if (nameInput) nameInput.value = user?.name || "";
    if (emailInput) emailInput.value = user?.email || "";
    setText("profile-name-text", user?.name);
    setText("profile-email-text", user?.email);

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!ApiClient.isAuthenticated()) return;
      const payload = {
        name: nameInput?.value.trim(),
        current_password: document.getElementById("current-password")?.value,
        new_password: document.getElementById("new-password")?.value,
      };
      if (!payload.new_password) {
        delete payload.current_password;
        delete payload.new_password;
      }
      try {
        const updated = await ApiClient.updateProfile(payload);
        const sidebarName = document.getElementById("sidebar-user-name");
        if (sidebarName) sidebarName.textContent = updated.name;
        setText("profile-name-text", updated.name);
        if (message) message.textContent = "Profil berhasil diperbarui.";
        form.reset();
        if (nameInput) nameInput.value = updated.name || "";
        if (emailInput) emailInput.value = updated.email || "";
      } catch (err) {
        if (message) message.textContent = err.message;
      }
    });
  }

  function initPhotoPicker() {
    const input = document.getElementById("profile-photo-input");
    document
      .getElementById("edit-photo-btn")
      ?.addEventListener("click", () => input?.click());
    input?.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem(PROFILE_PHOTO_KEY, reader.result);
        syncProfilePhoto();
      };
      reader.readAsDataURL(file);
    });
  }

  async function loadHistory() {
    const container = document.getElementById("history-container");
    if (!container) return [];
    container.innerHTML =
      '<p class="text-sm text-gray-400 italic text-center py-8">Memuat riwayat...</p>';
    if (!ApiClient.isAuthenticated()) {
      container.innerHTML =
        '<p class="text-sm text-gray-400 italic text-center py-8">Login untuk melihat riwayat</p>';
      return [];
    }
    const summaries = await ApiClient.listMyOrders();
    const orders = await Promise.all(
      summaries.map((o) => ApiClient.getOrder(o.id).catch(() => o)),
    );
    renderHistory(orders);
    return orders;
  }

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
        container.innerHTML = `<p class="text-sm text-red-400 italic text-center py-8">Gagal memuat: ${err.message}</p>`;
    }

    document.getElementById("search")?.addEventListener("input", (event) => {
      const keyword = event.target.value.toLowerCase();
      const filtered = keyword
        ? orders.filter(
            (order) =>
              String(order.id).includes(keyword) ||
              (order.items || []).some((item) =>
                item.menu_name.toLowerCase().includes(keyword),
              ),
          )
        : orders;
      renderHistory(filtered);
    });

    document
      .getElementById("notification-btn")
      ?.addEventListener("click", () => {
        document
          .getElementById("notification-panel")
          ?.classList.toggle("hidden");
        const marked = getNotifications().map((item) => ({
          ...item,
          read: true,
        }));
        saveNotifications(marked);
        renderNotifications();
      });
  }

  return { addNotification, init, renderNotifications, syncProfilePhoto };
})();

window.AccountPage = AccountPage;
window.initAccountPage = AccountPage.init;
