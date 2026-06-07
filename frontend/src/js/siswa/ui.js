const UI = (function () {
  console.log("UI module loaded");

  // ---- Page Navigation ----
  function showPage(pageId) {
    if (typeof pageId !== "string") return;
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("active"));
    const target = document.getElementById(pageId);
    if (target) target.classList.add("active");
    document.querySelectorAll(".sidebar-nav a").forEach((a) => {
      a.classList.toggle("active", a.dataset.page === pageId);
    });
  }

  // ---- Render Top Menu (Homepage) ----
  function renderTopMenu() {
    const container = document.getElementById("topMenuGrid");
    if (!container) return;

    const topMenus = MenuTable.getTopMenu();

    container.innerHTML = topMenus
      .map(
        (item, i) => `
      <div class="menu-card">
        <div class="menu-food-wrap">
          <div class="menu-food-img" style="background:linear-gradient(135deg,#f5e6c8,#e8c97a);display:flex;align-items:center;justify-content:center;border-radius:50%;width:80px;height:80px;">
            <svg style="width:40px;height:40px;color:#D4622A" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
          </div>
          <div class="rank-crown">${item.crown || ""}</div>
        </div>
        <div class="menu-card-name">${Utils.sanitize(item.name)}</div>
        <div class="menu-card-kantin">by ${Utils.sanitize(item.kantin)}</div>
        <button class="menu-card-btn" title="Pesan" onclick="UI.showPage('page-booking')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    `,
      )
      .join("");

    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  // ---- Render Kantin Options in Select ----
  function renderKantinSelect() {
    const select = document.getElementById("kantinSelect");
    if (!select) return;
    const kantins = MenuTable.getKantinList();
    select.innerHTML =
      `<option value="">Pilih Kantin▼</option>` +
      kantins
        .map(
          (k) => `<option value="${k.id}">${Utils.sanitize(k.name)}</option>`,
        )
        .join("");
  }

  // ---- Render Menu Grid by Kantin ----
  function renderMenuGrid(kantinId) {
    const container = document.getElementById("menuGrid");
    const header = document.getElementById("menuPanelHeader");
    if (!container) return;

    if (!kantinId) {
      container.innerHTML = `<div style="grid-column:span 2;text-align:center;padding:24px;color:var(--text-muted);font-size:12px;">Pilih kantin untuk melihat menu</div>`;
      if (header) header.textContent = "MENU KANTIN";
      return;
    }

    const menus = MenuTable.getMenuByKantin(kantinId);
    const kantins = MenuTable.getKantinList();
    const kantin = kantins.find((k) => String(k.id) === String(kantinId));

    if (header && kantin)
      header.textContent = `MENU ${kantin.name.toUpperCase()}`;

    if (menus.length === 0) {
      container.innerHTML = `<div style="grid-column:span 2;text-align:center;padding:24px;color:var(--text-muted);font-size:12px;">Tidak ada menu tersedia</div>`;
      return;
    }

    container.innerHTML = menus
      .map(
        (m) => `
      <div class="menu-item-card">
        <div class="menu-item-img-placeholder">
          <svg class="w-6 h-6 text-[#9E8E84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
            <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
        </div>
        <div class="menu-item-info">
          <div>
            <div class="menu-item-name">${Utils.sanitize(m.name)}</div>
            <div class="menu-item-price">${Utils.formatRupiah(m.price)}</div>
          </div>
          <button class="menu-item-add" data-id="${m.id}" title="Tambah">+</button>
        </div>
      </div>
    `,
      )
      .join("");

    container.querySelectorAll(".menu-item-add").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = MenuTable.findMenuItemById(btn.dataset.id);
        if (item) {
          Cart.addItem(item);
          renderOrderItems();
        }
      });
    });
  }

  // ---- Render Order Items in Form ----
  function renderOrderItems() {
    const container = document.getElementById("orderItemsList");
    const totalEl = document.getElementById("orderTotal");
    if (!container) return;

    const items = Cart.getItems();

    if (items.length === 0) {
      container.innerHTML = `<div style="font-size:11px;color:var(--text-muted);padding:8px 0;font-style:italic;">Belum ada item dipilih</div>`;
    } else {
      container.innerHTML = items
        .map(
          (i) => `
        <div class="order-item-row">
          <div class="order-item-name">${Utils.sanitize(i.menuItem.name)}</div>
          <div class="order-item-qty">${i.quantity}</div>
          <div class="order-item-price">${Utils.formatRupiah(i.menuItem.price * i.quantity)}</div>
        </div>
      `,
        )
        .join("");
    }

    if (totalEl) totalEl.textContent = Utils.formatRupiah(Cart.getTotal());
  }

  // ---- Update estimasi waktu di booking page ----
  // Jumlah semua item dari pesanan COOKING × 5 menit
  async function updateEstimasiWaktu() {
    const el = document.getElementById("estimasiMenit");
    if (!el) return;

    try {
      if (typeof ApiClient === "undefined" || !ApiClient.isAuthenticated()) {
        el.textContent = "~5 menit";
        return;
      }

      const orders = await ApiClient.listMyOrders();
      const cookingOrders = orders.filter((o) => o.status === "COOKING");

      if (cookingOrders.length === 0) {
        el.textContent = "~5 menit";
        return;
      }

      let totalItems = 0;
      for (const ord of cookingOrders) {
        try {
          const detail = await ApiClient.getOrder(ord.id);
          if (Array.isArray(detail.items)) {
            totalItems += detail.items.reduce(
              (sum, it) => sum + (it.quantity || 1),
              0,
            );
          } else {
            totalItems += 1;
          }
        } catch (e) {
          totalItems += 1;
        }
      }

      el.textContent = `~${totalItems * 5} menit`;
    } catch (err) {
      el.textContent = "~5 menit";
    }
  }

  // ---- Render Order Status Card (After Pesan) ----
  function renderOrderStatus(orderId, itemSummary, total) {
    const overlay = document.getElementById("orderStatusOverlay");
    if (!overlay) return;

    const steps = OrderStateMachine.getSteps();
    const labels = OrderStateMachine.getLabels();

    const stepsHtml = steps
      .map((step) => {
        const status = OrderStateMachine.getStepStatus(step);

        let bg = "bg-gray-300";
        let content = "";

        if (status === "done") {
          bg = "bg-green-500";
          content = "✓";
        } else if (
          status === "active" &&
          step === OrderStateMachine.STATES.DONE
        ) {
          bg = "bg-green-500";
          content = "✓";
        } else if (status === "active") {
          bg = "bg-[#D4622A]";
        }

        return `
        <div class="flex items-center gap-3">
          <div class="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${bg}">
            ${content}
          </div>
          <div class="text-sm text-[#2D2D2D]">${labels[step]}</div>
        </div>
      `;
      })
      .join("");

    overlay.innerHTML = `
      <div class="pointer-events-auto w-[340px] bg-[#F4EFE2] rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[#e6dcc8]">

        <div class="flex items-center justify-between mb-1">
          <div class="text-[12px] text-gray-400">Pesanan Saat Ini</div>
          <button
            onclick="UI.hideOrderStatus()"
            class="w-6 h-6 rounded-full bg-[#e8dfd0] hover:bg-[#d9cfbf] flex items-center justify-center text-gray-500 transition text-[16px] leading-none font-bold"
            title="Tutup"
          >×</button>
        </div>

        <div class="text-[38px] leading-none font-extrabold text-[#2D2D2D] mb-3">
          #${Utils.sanitize(orderId)}
        </div>

        <div class="text-[15px] text-gray-500 mb-5 leading-relaxed">
          ${Utils.sanitize(itemSummary)}
        </div>

        <div class="flex justify-between items-center mb-6">
          <span class="text-[15px] font-semibold text-gray-500">Total</span>
          <span class="text-[30px] font-extrabold text-[#D4622A]">
            ${Utils.formatRupiah(total)}
          </span>
        </div>

        <div class="space-y-4">
          ${stepsHtml}
        </div>

        <div class="mt-6 text-[11px] text-gray-400 leading-relaxed">
          *gunakan kode ini untuk ambil pesanan kamu di kantin
        </div>

      </div>
    `;

    // Tampilkan overlay
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");
  }

  // ---- Sembunyikan Order Status ----
  function hideOrderStatus() {
    const overlay = document.getElementById("orderStatusOverlay");
    if (!overlay) return;
    overlay.classList.remove("flex");
    overlay.classList.add("hidden");
  }

  // ---- Toggle Order Status (tombol jam) ----
  // Kalau overlay sedang tampil → sembunyikan
  // Kalau tersembunyi → tampilkan lagi (hanya jika ada pesanan aktif)
  function toggleOrderStatus() {
    const overlay = document.getElementById("orderStatusOverlay");
    if (!overlay) return;

    const isVisible = overlay.classList.contains("flex");

    if (isVisible) {
      hideOrderStatus();
    } else {
      const state =
        typeof OrderStateMachine !== "undefined"
          ? OrderStateMachine.getState()
          : "IDLE";

      if (state === "IDLE" || overlay.innerHTML.trim() === "") {
        // Belum ada pesanan — kasih info singkat
        const info = document.createElement("div");
        info.className =
          "pointer-events-auto w-[340px] bg-[#F4EFE2] rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[#e6dcc8] text-center";
        info.innerHTML = `
          <div class="text-[40px] mb-3">🕐</div>
          <div class="text-[14px] font-semibold text-[#2D2D2D] mb-1">Belum ada pesanan aktif</div>
          <div class="text-[11px] text-gray-400">Pesan makanan dulu yuk!</div>
          <button onclick="UI.hideOrderStatus()" class="mt-4 text-[11px] text-[#D4622A] hover:underline">Tutup</button>
        `;
        overlay.innerHTML = "";
        overlay.appendChild(info);
        overlay.classList.remove("hidden");
        overlay.classList.add("flex");
        return;
      }

      // Ada pesanan aktif — tampilkan kembali
      overlay.classList.remove("hidden");
      overlay.classList.add("flex");
    }
  }

  return {
    showPage,
    renderTopMenu,
    renderKantinSelect,
    renderMenuGrid,
    renderOrderItems,
    renderOrderStatus,
    hideOrderStatus,
    toggleOrderStatus,
    updateEstimasiWaktu,
  };
})();

window.UI = UI;
