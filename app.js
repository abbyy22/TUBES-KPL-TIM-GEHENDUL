/**
 * telFood - Food Ordering Application
 * 
 * Teknik Konstruksi:
 * 1. Defensive Programming / Design by Contract (DbC) - precondition/postcondition checks
 * 2. Automata - order status state machine
 * 3. Table-driven construction - menu & kantin lookup tables
 * 4. Code reuse / library - reusable utility module
 */

'use strict';

/* =============================================
   UTILITY MODULE (Code reuse / library)
   Reusable helpers across the application
   ============================================= */
const Utils = (function () {
  /**
   * Format angka ke format Rupiah
   * @param {number} amount - Jumlah uang
   * @returns {string} Formatted string
   */
  function formatRupiah(amount) {
    // Defensive: pastikan input valid number
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.error('[Utils.formatRupiah] Invalid amount:', amount);
      return 'Rp. 0';
    }
    return 'Rp. ' + amount.toLocaleString('id-ID');
  }

  /**
   * Generate order ID unik
   * @returns {string} Order ID
   */
  function generateOrderId() {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  /**
   * Sanitize string input (prevent XSS)
   * @param {string} str
   * @returns {string}
   */
  function sanitize(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Validate nama field
   * @param {string} nama
   * @returns {{ valid: boolean, message: string }}
   */
  function validateNama(nama) {
    if (!nama || nama.trim().length === 0) {
      return { valid: false, message: 'Nama tidak boleh kosong' };
    }
    return { valid: true, message: '' };
  }

  return { formatRupiah, generateOrderId, sanitize, validateNama };
})();


/* =============================================
   TABLE-DRIVEN CONSTRUCTION
   Data kantin dan menu disimpan di lookup table
   ============================================= */
const MenuTable = (function () {
  // Tabel kantin
  const KANTIN_LIST = [
    { id: 'neo1', name: 'Kantin NEO 1' },
    { id: 'neo2', name: 'Kantin NEO 2' },
    { id: 'tpb',  name: 'Kantin TPB'  },
    { id: 'gkm',  name: 'Kantin GKM'  },
  ];

  // Tabel menu per kantin
  const MENU_DATA = {
    neo1: [
      { id: 'm1', name: 'Nasi goreng maza', price: 15000, emoji: '🍳', kantin: 'Kantin NEO 1' },
      { id: 'm2', name: 'Es teh manis',     price: 2000,  emoji: '🍵', kantin: 'Kantin NEO 1' },
      { id: 'm3', name: 'Mie goreng spesial', price: 13000, emoji: '🍜', kantin: 'Kantin NEO 1' },
      { id: 'm4', name: 'Ayam bakar',       price: 18000, emoji: '🍗', kantin: 'Kantin NEO 1' },
      { id: 'm5', name: 'Nasi putih',       price: 5000,  emoji: '🍚', kantin: 'Kantin NEO 1' },
      { id: 'm6', name: 'Soto ayam',        price: 12000, emoji: '🥣', kantin: 'Kantin NEO 1' },
    ],
    neo2: [
      { id: 'n1', name: 'Bakso kuah',       price: 14000, emoji: '🍲', kantin: 'Kantin NEO 2' },
      { id: 'n2', name: 'Nasi uduk',        price: 12000, emoji: '🍙', kantin: 'Kantin NEO 2' },
      { id: 'n3', name: 'Tahu goreng',      price: 3000,  emoji: '🟨', kantin: 'Kantin NEO 2' },
      { id: 'n4', name: 'Es jeruk',         price: 3000,  emoji: '🍊', kantin: 'Kantin NEO 2' },
      { id: 'n5', name: 'Gado-gado',        price: 13000, emoji: '🥗', kantin: 'Kantin NEO 2' },
      { id: 'n6', name: 'Tempe mendoan',    price: 4000,  emoji: '🟫', kantin: 'Kantin NEO 2' },
    ],
    tpb: [
      { id: 't1', name: 'Nasi rames',       price: 11000, emoji: '🍱', kantin: 'Kantin TPB' },
      { id: 't2', name: 'Jus alpukat',      price: 8000,  emoji: '🥑', kantin: 'Kantin TPB' },
      { id: 't3', name: 'Pecel lele',       price: 16000, emoji: '🐟', kantin: 'Kantin TPB' },
      { id: 't4', name: 'Es campur',        price: 6000,  emoji: '🧊', kantin: 'Kantin TPB' },
      { id: 't5', name: 'Nasi goreng telur',price: 13000, emoji: '🍳', kantin: 'Kantin TPB' },
      { id: 't6', name: 'Sate ayam',        price: 15000, emoji: '🍢', kantin: 'Kantin TPB' },
    ],
    gkm: [
      { id: 'g1', name: 'Mie ayam',         price: 12000, emoji: '🍜', kantin: 'Kantin GKM' },
      { id: 'g2', name: 'Siomay',           price: 10000, emoji: '🥟', kantin: 'Kantin GKM' },
      { id: 'g3', name: 'Ketoprak',         price: 11000, emoji: '🥣', kantin: 'Kantin GKM' },
      { id: 'g4', name: 'Es teh tawar',     price: 2000,  emoji: '🍵', kantin: 'Kantin GKM' },
      { id: 'g5', name: 'Batagor',          price: 9000,  emoji: '🐟', kantin: 'Kantin GKM' },
      { id: 'g6', name: 'Nasi kuning',      price: 14000, emoji: '🍚', kantin: 'Kantin GKM' },
    ],
  };

  // Top menu (untuk homepage)
  const TOP_MENU = [
    { rank: 1, name: 'Nasi Goreng Maza', kantin: 'Kantin NEO 1', crown: '👑', color: '#d4af37' },
    { rank: 2, name: 'Nasi Goreng Maza', kantin: 'Kantin NEO 1', crown: '🥈', color: '#a8a9ad' },
    { rank: 3, name: 'Nasi Goreng Maza', kantin: 'Kantin NEO 1', crown: '🥉', color: '#cd7f32' },
  ];

  /**
   * Ambil semua kantin
   * @returns {Array}
   */
  function getKantinList() {
    return [...KANTIN_LIST]; // defensive: return copy
  }

  /**
   * Ambil menu berdasarkan kantin ID
   * @param {string} kantinId
   * @returns {Array}
   */
  function getMenuByKantin(kantinId) {
    // Defensive: validasi kantinId
    if (typeof kantinId !== 'string' || kantinId.trim() === '') {
      console.warn('[MenuTable.getMenuByKantin] Invalid kantinId');
      return [];
    }
    return MENU_DATA[kantinId] ? [...MENU_DATA[kantinId]] : [];
  }

  /**
   * Ambil top menu untuk homepage
   * @returns {Array}
   */
  function getTopMenu() {
    return [...TOP_MENU];
  }

  /**
   * Cari menu item by id di semua kantin
   * @param {string} itemId
   * @returns {Object|null}
   */
  function findMenuItemById(itemId) {
    for (const kantin of Object.values(MENU_DATA)) {
      const found = kantin.find(m => m.id === itemId);
      if (found) return { ...found };
    }
    return null;
  }

  return { getKantinList, getMenuByKantin, getTopMenu, findMenuItemById };
})();


/* =============================================
   ORDER STATE MACHINE (Automata)
   States: IDLE → ORDERED → COOKING → READY → DONE
   ============================================= */
const OrderStateMachine = (function () {
  const STATES = {
    IDLE:    'IDLE',
    ORDERED: 'ORDERED',
    COOKING: 'COOKING',
    READY:   'READY',
    DONE:    'DONE',
  };

  // Transition table: state → allowed next states
  const TRANSITIONS = {
    [STATES.IDLE]:    [STATES.ORDERED],
    [STATES.ORDERED]: [STATES.COOKING],
    [STATES.COOKING]: [STATES.READY],
    [STATES.READY]:   [STATES.DONE],
    [STATES.DONE]:    [STATES.IDLE],
  };

  // State display labels
  const STATE_LABELS = {
    [STATES.ORDERED]: 'Dipesan',
    [STATES.COOKING]: 'Dimasak',
    [STATES.READY]:   'Siap Diambil',
    [STATES.DONE]:    'Selesai',
  };

  let currentState = STATES.IDLE;

  /**
   * Cek apakah transisi valid
   * @param {string} toState
   * @returns {boolean}
   */
  function canTransition(toState) {
    const allowed = TRANSITIONS[currentState] || [];
    return allowed.includes(toState);
  }

  /**
   * Lakukan transisi state
   * @param {string} toState
   * @returns {boolean} Sukses atau tidak
   */
  function transition(toState) {
    // Precondition (DbC): state tujuan harus valid
    if (!Object.values(STATES).includes(toState)) {
      console.error('[OrderStateMachine] Invalid target state:', toState);
      return false;
    }
    if (!canTransition(toState)) {
      console.warn(`[OrderStateMachine] Cannot transition ${currentState} → ${toState}`);
      return false;
    }
    currentState = toState;
    console.log('[OrderStateMachine] State:', currentState);
    return true;
  }

  /**
   * Reset ke IDLE
   */
  function reset() {
    currentState = STATES.IDLE;
  }

  /**
   * Get current state
   * @returns {string}
   */
  function getState() {
    return currentState;
  }

  /**
   * Get labels untuk status display
   * @returns {Object}
   */
  function getLabels() {
    return { ...STATE_LABELS };
  }

  /**
   * Get urutan steps untuk display
   * @returns {Array}
   */
  function getSteps() {
    return [STATES.ORDERED, STATES.COOKING, STATES.READY, STATES.DONE];
  }

  /**
   * Cek apakah step sudah selesai/aktif
   * @param {string} step
   * @returns {string} 'done' | 'active' | 'inactive'
   */
  function getStepStatus(step) {
    const order = getSteps();
    const currentIdx = order.indexOf(currentState);
    const stepIdx = order.indexOf(step);
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'active';
    return 'inactive';
  }

  return {
    STATES,
    transition,
    reset,
    getState,
    getLabels,
    getSteps,
    getStepStatus,
    canTransition,
  };
})();


/* =============================================
   CART MODULE
   Manage order items
   ============================================= */
const Cart = (function () {
  let items = []; // { menuItem, quantity }

  /**
   * Tambah item ke cart
   * Precondition (DbC): menuItem harus punya id, name, price
   * @param {Object} menuItem
   */
  function addItem(menuItem) {
    // Precondition
    if (!menuItem || typeof menuItem.id !== 'string' || typeof menuItem.price !== 'number') {
      console.error('[Cart.addItem] Invalid menuItem:', menuItem);
      return;
    }

    const existing = items.find(i => i.menuItem.id === menuItem.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ menuItem: { ...menuItem }, quantity: 1 });
    }

    // Postcondition: item harus ada di cart
    console.assert(items.some(i => i.menuItem.id === menuItem.id), '[Cart.addItem] Postcondition failed');
  }

  /**
   * Hapus satu quantity item
   * @param {string} itemId
   */
  function removeOne(itemId) {
    if (typeof itemId !== 'string') return;
    const idx = items.findIndex(i => i.menuItem.id === itemId);
    if (idx === -1) return;
    items[idx].quantity -= 1;
    if (items[idx].quantity <= 0) {
      items.splice(idx, 1);
    }
  }

  /**
   * Hitung total harga
   * @returns {number}
   */
  function getTotal() {
    return items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  }

  /**
   * Get semua item
   * @returns {Array}
   */
  function getItems() {
    return items.map(i => ({ ...i, menuItem: { ...i.menuItem } }));
  }

  /**
   * Kosongkan cart
   */
  function clear() {
    items = [];
  }

  /**
   * Cek apakah cart kosong
   * @returns {boolean}
   */
  function isEmpty() {
    return items.length === 0;
  }

  return { addItem, removeOne, getTotal, getItems, clear, isEmpty };
})();


/* =============================================
   UI MODULE
   Handle semua rendering dan DOM manipulation
   ============================================= */
const UI = (function () {

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
  function renderOrderStatus(orderId, itemSummary) {
    // Precondition (DbC)
    if (typeof orderId !== 'string' || orderId.trim() === '') {
      console.error('[UI.renderOrderStatus] Invalid orderId');
      return;
    }

    const overlay = document.getElementById('orderStatusOverlay');
    if (!overlay) return;

    const steps = OrderStateMachine.getSteps();
    const labels = OrderStateMachine.getLabels();

    const stepsHtml = steps.map(step => {
      const status = OrderStateMachine.getStepStatus(step);
      let dotContent = '';
      if (status === 'done') dotContent = '✓';
      else if (status === 'active') dotContent = '<span style="width:8px;height:8px;background:white;border-radius:50%;display:block;"></span>';

      return `
        <div class="status-step ${status}">
          <div class="step-dot">${dotContent}</div>
          <div class="step-label">${labels[step]}</div>
        </div>
      `;
    }).join('');

    overlay.innerHTML = `
      <div class="order-status-card">
        <div class="order-status-label">Pesanan Saat Ini</div>
        <div class="order-status-title">Order #${Utils.sanitize(orderId)}</div>
        <div class="order-status-item">${Utils.sanitize(itemSummary)}</div>
        <div class="order-total-info">
          <span class="order-total-info-label">total</span>
          <span class="order-total-info-value">${Utils.formatRupiah(Cart.getTotal())}</span>
        </div>
        <div class="status-steps">${stepsHtml}</div>
        <div class="order-status-note">*gunakan code ini untuk mengambil pesanan kamu di kantin</div>
      </div>
    `;

    overlay.classList.add('show');
  }

  // ---- Show/Hide Order Status ----
  function hideOrderStatus() {
    const overlay = document.getElementById('orderStatusOverlay');
    if (overlay) overlay.classList.remove('show');
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


/* =============================================
   APP CONTROLLER
   Orkestrasi semua module
   ============================================= */
const App = (function () {
  let currentOrderId = null;

  function init() {
    // Render initial UI
    UI.renderTopMenu();
    UI.renderKantinSelect();
    UI.renderMenuGrid('');
    UI.renderOrderItems();
    UI.showPage('page-home');

    // Bind sidebar navigation
    document.querySelectorAll('.sidebar-nav a[data-page]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        UI.showPage(a.dataset.page);
        UI.hideOrderStatus();
      });
    });

    // Bind hero CTA button
    const heroCta = document.getElementById('heroCta');
    if (heroCta) {
      heroCta.addEventListener('click', () => {
        UI.showPage('page-booking');
        UI.hideOrderStatus();
      });
    }

    // Bind kantin select change
    const kantinSelect = document.getElementById('kantinSelect');
    if (kantinSelect) {
      kantinSelect.addEventListener('change', () => {
        UI.renderMenuGrid(kantinSelect.value);
      });
    }

    // Bind search (basic filter)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        // Basic search - just filter visual (no backend)
        const query = searchInput.value.toLowerCase();
        document.querySelectorAll('.menu-item-card').forEach(card => {
          const name = card.querySelector('.menu-item-name')?.textContent.toLowerCase() || '';
          card.style.opacity = name.includes(query) ? '1' : '0.3';
        });
      });
    }

    // Bind Pesan Sekarang button (form submit)
    const pesanBtn = document.getElementById('pesanBtn');
    if (pesanBtn) {
      pesanBtn.addEventListener('click', handlePesan);
    }

    console.log('[App] telFood initialized');
  }

  /**
   * Handle submit pesanan
   * Design by Contract:
   * - Precondition: nama tidak kosong, kantin dipilih, cart tidak kosong
   * - Postcondition: order state berubah ke ORDERED, status card tampil
   */
  function handlePesan() {
    const namaInput = document.getElementById('namaInput');
    const kantinSelect = document.getElementById('kantinSelect');

    // ---- Precondition checks (Defensive Programming / DbC) ----
    const namaVal = namaInput ? namaInput.value.trim() : '';
    const namaValidation = Utils.validateNama(namaVal);

    if (!namaValidation.valid) {
      showFormError(namaInput, namaValidation.message);
      return;
    }

    if (!kantinSelect || !kantinSelect.value) {
      showFormError(kantinSelect, 'Pilih kantin terlebih dahulu');
      return;
    }

    if (Cart.isEmpty()) {
      alert('Tambahkan menu terlebih dahulu!');
      return;
    }

    // ---- Proses pesanan ----
    // Transisi state machine: IDLE → ORDERED
    const ok = OrderStateMachine.transition(OrderStateMachine.STATES.ORDERED);
    if (!ok) {
      console.error('[App.handlePesan] State transition failed');
      return;
    }

    // Generate order ID
    currentOrderId = Utils.generateOrderId();

    // Summary item untuk display
    const items = Cart.getItems();
    const itemSummary = items.length > 0
      ? items[0].menuItem.name + (items.length > 1 ? ` + ${items.length - 1} lainnya` : '')
      : '-';

    // Render order status card
    UI.renderOrderStatus(currentOrderId, itemSummary);

    // Postcondition assertion
    console.assert(
      OrderStateMachine.getState() === OrderStateMachine.STATES.ORDERED,
      '[App.handlePesan] Postcondition failed: state not ORDERED'
    );

    // Simulate cooking after 3s (demo automata)
    setTimeout(() => {
      if (OrderStateMachine.canTransition(OrderStateMachine.STATES.COOKING)) {
        OrderStateMachine.transition(OrderStateMachine.STATES.COOKING);
        const itemSummaryNew = items.length > 0
          ? items[0].menuItem.name + (items.length > 1 ? ` + ${items.length - 1} lainnya` : '')
          : '-';
        UI.renderOrderStatus(currentOrderId, itemSummaryNew);
      }
    }, 3000);

    console.log('[App] Order placed:', currentOrderId);
  }

  /**
   * Tampilkan error pada input field
   * @param {HTMLElement} input
   * @param {string} msg
   */
  function showFormError(input, msg) {
    if (!input) return;
    input.style.borderColor = '#e53935';
    input.focus();
    const existing = input.parentElement.querySelector('.field-error');
    if (!existing) {
      const err = document.createElement('div');
      err.className = 'field-error';
      err.style.cssText = 'font-size:10px;color:#e53935;margin-top:3px;';
      err.textContent = msg;
      input.parentElement.appendChild(err);
      setTimeout(() => {
        err.remove();
        input.style.borderColor = '';
      }, 2500);
    }
  }

  return { init };
})();

// ---- Bootstrap ----
document.addEventListener('DOMContentLoaded', () => App.init());