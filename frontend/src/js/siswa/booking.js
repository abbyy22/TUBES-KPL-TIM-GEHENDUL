const booking = (() => {

    function renderKantinSelect() {
        const select = document.getElementById('kantinSelect');
        if (!select) return;

        const kantins = MenuTable.getKantinList();

        select.innerHTML =
            `<option value="">Pilih Kantin</option>` +
            kantins.map(k => `
        <option value="${k.id}">
          ${Utils.sanitize(k.name)}
        </option>
      `).join('');

        // Bind change event: update menu grid when kantin is selected
        select.addEventListener('change', () => {
            renderMenuGrid(select.value);
        });
    }

    function renderMenuGrid(kantinId) {
        const container = document.getElementById('menuGrid');
        const header = document.getElementById('menuPanelHeader');

        if (!container) return;

        if (!kantinId) {
            container.innerHTML = `<div class="col-span-2 text-center py-6 text-gray-400 text-xs italic">Pilih kantin untuk melihat menu</div>`;
            if (header) header.textContent = 'MENU KANTIN';
            return;
        }

        const menus = MenuTable.getMenuByKantin(kantinId);
        const kantins = MenuTable.getKantinList();
        const kantin = kantins.find(k => k.id === kantinId);

        if (header && kantin) header.textContent = `MENU ${kantin.name.toUpperCase()}`;

        if (menus.length === 0) {
            container.innerHTML = `<div class="col-span-2 text-center py-6 text-gray-400 text-xs italic">Tidak ada menu tersedia</div>`;
            return;
        }

        container.innerHTML = menus.map(m => `
    <div class="bg-[#F0E8D5] rounded-xl overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]">

        <div class="w-full h-20 bg-[linear-gradient(135deg,#e8dfd0,#d4c5a9)]
            flex items-center justify-center text-[28px]">
            ${m.emoji}
        </div>

        <div class="px-[10px] py-2 flex items-center justify-between gap-2">

            <div class="flex-1">

                <div class="text-[10px] font-semibold text-[#2D2D2D] leading-[1.3]">
                    ${Utils.sanitize(m.name)}
                </div>

                <div class="text-[10px] text-gray-500 whitespace-nowrap">
                    ${Utils.formatRupiah(m.price)}
                </div>

            </div>

            <div class="flex items-center gap-1">

                <button
                    class="menu-item-min w-5 h-5 rounded-full bg-gray-300 hover:bg-gray-400
                    text-[#2D2D2D] flex items-center justify-center
                    text-[14px] font-bold leading-none shrink-0 transition-colors duration-200"
                    data-id="${m.id}"
                    title="Kurang"
                >
                    -
                </button>

                <button
                    class="menu-item-add w-5 h-5 rounded-full bg-[#D4622A] hover:bg-[#bb5422]
                    text-[#F4EFE2] flex items-center justify-center
                    text-[14px] font-bold leading-none shrink-0 transition-colors duration-200"
                    data-id="${m.id}"
                    title="Tambah"
                >
                    +
                </button>

            </div>

        </div>

    </div>
    `).join('');

        bindAddButtons();
        bindMinButtons();
    }

    function bindAddButtons() {
        document.querySelectorAll('.menu-item-add').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = MenuTable.findMenuItemById(btn.dataset.id);

                if (item) {
                    Cart.addItem(item);
                    renderOrderItems();
                }
            });
        });
    }

    function bindMinButtons() {
        document.querySelectorAll('.menu-item-min').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = MenuTable.findMenuItemById(btn.dataset.id);

                if (item) {
                    Cart.removeItem(item.id);
                    renderOrderItems();
                }
            });
        });
    }

    function renderOrderItems() {
        const container = document.getElementById('orderItemsList');
        const totalEl = document.getElementById('orderTotal');

        if (!container || !totalEl) return;

        const items = Cart.getItems();

        if (items.length === 0) {
            container.innerHTML = `<div class="text-xs text-gray-400 italic py-2">Belum ada item dipilih</div>`;
        } else {
            container.innerHTML = items.map(i => `
        <div class="flex justify-between text-sm mb-2">
          <span class="text-[#2D2D2D]">${Utils.sanitize(i.menuItem.name)} <span class="text-gray-400">x${i.quantity}</span></span>
          <span class="font-semibold text-[#D4622A]">
            ${Utils.formatRupiah(i.menuItem.price * i.quantity)}
          </span>
        </div>
      `).join('');
        }

        totalEl.textContent = Utils.formatRupiah(Cart.getTotal());
    }

    return {
        renderKantinSelect,
        renderMenuGrid,
        renderOrderItems,
    };

})();

window.booking = booking;
