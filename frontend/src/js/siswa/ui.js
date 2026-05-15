const UI = (function () {
  console.log('UI module loaded');

  // ---- Page Navigation ----
  function showPage(pageId) {
    // Precondition
    if (typeof pageId !== 'string') return;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');

    // Update sidebar nav active state
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
      a.classList.toggle('active', a.dataset.page === pageId);
    });
  }

  // ---- Render Top Menu (Homepage) ----
  function renderTopMenu() {

    const container = document.getElementById('topMenuGrid');
    if (!container) return;

    const topMenus = MenuTable.getTopMenu();
    const foodEmojis = ['🍳', '🍜', '🍱'];

    container.innerHTML = topMenus.map((item, i) => `
      <div class="menu-card">
        <div class="menu-food-wrap">
          <div class="menu-food-img" style="background:linear-gradient(135deg,#f5e6c8,#e8c97a);display:flex;align-items:center;justify-content:center;font-size:46px;border-radius:50%;">
            ${foodEmojis[i]}
          </div>
          <div class="rank-crown">${item.crown}</div>
        </div>
        <div class="menu-card-name">${Utils.sanitize(item.name)}</div>
        <div class="menu-card-kantin">by ${Utils.sanitize(item.kantin)}</div>
        <button class="menu-card-btn" title="Pesan" onclick="UI.showPage('page-booking')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        
      </div>
    `).join('');
  }

  // ---- Render Kantin Options in Select ----
  function renderKantinSelect() {
    const select = document.getElementById('kantinSelect');
    if (!select) return;

    const kantins = MenuTable.getKantinList();
    select.innerHTML = `<option value="">Pilih Kantin▼</option>` +
      kantins.map(k => `<option value="${k.id}">${Utils.sanitize(k.name)}</option>`).join('');
  }

  // ---- Render Menu Grid by Kantin ----
  function renderMenuGrid(kantinId) {
    const container = document.getElementById('menuGrid');
    const header = document.getElementById('menuPanelHeader');
    if (!container) return;

    if (!kantinId) {
      container.innerHTML = `<div style="grid-column:span 2;text-align:center;padding:24px;color:var(--text-muted);font-size:12px;">Pilih kantin untuk melihat menu</div>`;
      if (header) header.textContent = 'MENU KANTIN';
      return;
    }

    const menus = MenuTable.getMenuByKantin(kantinId);
    const kantins = MenuTable.getKantinList();
    const kantin = kantins.find(k => k.id === kantinId);

    if (header && kantin) header.textContent = `MENU ${kantin.name.toUpperCase()}`;

    if (menus.length === 0) {
      container.innerHTML = `<div style="grid-column:span 2;text-align:center;padding:24px;color:var(--text-muted);font-size:12px;">Tidak ada menu tersedia</div>`;
      return;
    }

    container.innerHTML = menus.map(m => `
      <div class="menu-item-card">
        <div class="menu-item-img-placeholder">${m.emoji}</div>
        <div class="menu-item-info">
          <div>
            <div class="menu-item-name">${Utils.sanitize(m.name)}</div>
            <div class="menu-item-price">${Utils.formatRupiah(m.price)}</div>
          </div>
          <button class="menu-item-add" data-id="${m.id}" title="Tambah">+</button>
        </div>
      </div>
    `).join('');

    // Bind add buttons
    container.querySelectorAll('.menu-item-add').forEach(btn => {
      btn.addEventListener('click', () => {
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
    const container = document.getElementById('orderItemsList');
    const totalEl = document.getElementById('orderTotal');
    if (!container) return;

    const items = Cart.getItems();

    if (items.length === 0) {
      container.innerHTML = `<div style="font-size:11px;color:var(--text-muted);padding:8px 0;font-style:italic;">Belum ada item dipilih</div>`;
    } else {
      container.innerHTML = items.map(i => `
        <div class="order-item-row">
          <div class="order-item-name">${Utils.sanitize(i.menuItem.name)}</div>
          <div class="order-item-qty">${i.quantity}</div>
          <div class="order-item-price">${Utils.formatRupiah(i.menuItem.price * i.quantity)}</div>
        </div>
      `).join('');
    }

    if (totalEl) totalEl.textContent = Utils.formatRupiah(Cart.getTotal());
  }

  // ---- Render Order Status Card (After Pesen) ----
  function renderOrderStatus(orderId, itemSummary, total) {
    const overlay = document.getElementById('orderStatusOverlay');
    if (!overlay) return;

    const steps = OrderStateMachine.getSteps();
    const labels = OrderStateMachine.getLabels();

    const stepsHtml = steps.map(step => {
      const status = OrderStateMachine.getStepStatus(step);

      let bg = 'bg-gray-300';
      let content = '';

      if (status === 'done') {
        bg = 'bg-green-500';
        content = '✓';
      } else if (
        status === 'active' &&
        step === OrderStateMachine.STATES.DONE
      ) {
        bg = 'bg-green-500';
        content = '✓';
      } else if (status === 'active') {
        bg = 'bg-[#D4622A]';
      }
      return `
      <div class="flex items-center gap-3">
        
        <div class="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${bg}">
          ${content}
        </div>

        <div class="text-sm text-[#2D2D2D]">
          ${labels[step]}
        </div>

      </div>
    `;
    }).join('');

    overlay.innerHTML = `
  <div class="pointer-events-auto w-[340px] bg-[#F4EFE2] rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[#e6dcc8]">

    <div class="text-[12px] text-gray-400 mb-1">
      Pesanan Saat Ini
    </div>

    <div class="text-[38px] leading-none font-extrabold text-[#2D2D2D] mb-3">
      #${Utils.sanitize(orderId)}
    </div>

    <div class="text-[15px] text-gray-500 mb-5 leading-relaxed">
      ${Utils.sanitize(itemSummary)}
    </div>

    <div class="flex justify-between items-center mb-6">
      <span class="text-[15px] font-semibold text-gray-500">
        Total
      </span>

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

    // INI PENTING
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
  }

  // ---- Show/Hide Order Status ----
  function hideOrderStatus() {
    const overlay = document.getElementById('orderStatusOverlay');

    if (overlay) {
      overlay.classList.add('hidden');
      overlay.classList.remove('flex');
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
  };
})();