const dashSiswa = (() => {
  // Inline SVG icons (no external dependency needed)
  const foodIcons = [
    // cooking-pot
    `<i data-lucide="cooking-pot" class="w-12 h-12 text-[#D4622A]"></i> `,
    // bowl with utensils (soup)
    `<i data-lucide="soup" class="w-12 h-12 text-[#D4622A]"></i> `,
    // salad/plate
    `<i data-lucide="salad" class="w-12 h-12 text-[#D4622A]"></i> `,
  ];

  /**
   * Navigasi ke halaman booking, lalu otomatis:
   * 1. Pilih kantin yang sesuai
   * 2. Tampilkan menu kantin
   * 3. Tambah item ke cart
   */
  async function orderTopMenu(kantinId, menuId) {
    let resolvedKantinId = kantinId;
    let resolvedMenuId = menuId;

    if (MenuTable.isApiBacked()) {
      const kantin = MenuTable.getKantinList().find(
        (k) => k.code === kantinId || String(k.id) === String(kantinId),
      );
      if (kantin) {
        resolvedKantinId = kantin.id;
        const kantinMenus = MenuTable.getMenuByKantin(resolvedKantinId);
        let foundMenu = null;
        if (menuId === "m1") {
          foundMenu = kantinMenus.find((m) =>
            m.name.toLowerCase().includes("nasi goreng"),
          );
        } else if (menuId === "m3") {
          foundMenu = kantinMenus.find((m) =>
            m.name.toLowerCase().includes("bakso"),
          );
        } else if (menuId === "m5") {
          foundMenu = kantinMenus.find(
            (m) =>
              m.name.toLowerCase().includes("ayam") ||
              m.name.toLowerCase().includes("rames"),
          );
        }
        if (foundMenu) {
          resolvedMenuId = foundMenu.id;
        } else if (kantinMenus.length > 0) {
          resolvedMenuId = kantinMenus[0].id;
        }
      }
    }

    // Navigasi ke halaman booking dulu
    await loadPage("siswa-booking");

    // Tunggu DOM siap
    await new Promise((r) => setTimeout(r, 80));

    // Pilih kantin di select
    const kantinSelect = document.getElementById("kantinSelect");
    if (kantinSelect && resolvedKantinId) {
      kantinSelect.value = resolvedKantinId;
      // Trigger render menu grid
      booking.renderMenuGrid(resolvedKantinId);
    }

    // Tambah item ke cart jika menuId tersedia
    if (resolvedMenuId) {
      await new Promise((r) => setTimeout(r, 60));
      const item = MenuTable.findMenuItemById(resolvedMenuId);
      if (item) {
        Cart.addItem(item);
        booking.renderOrderItems();
      }
    }
  }

  function renderTopMenu() {
    const container = document.getElementById("topMenuGrid");

    if (!container) {
      console.error("Container for top menu not found");
      return;
    }

    const topMenus = MenuTable.getTopMenu();

    container.innerHTML = topMenus
      .map(
        (item, i) => `
      <div class="bg-[#F4EFE2] rounded-[22px] p-4 text-center shadow-md">
        <div class="flex items-center justify-center mb-3">
          ${foodIcons[i]}
        </div>

        <div class="text-sm font-semibold text-[#2D2D2D] mb-1">
          ${Utils.sanitize(item.name)}
        </div>

        <div class="text-xs text-gray-400 mb-3">
          by ${Utils.sanitize(item.kantin)}
        </div>

        <button
          onclick="dashSiswa.orderTopMenu('${item.kantin_id || ''}', '${item.menu_id || ''}')"
          class="bg-[#D4622A] hover:bg-[#bb5422] text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xl font-bold transition hover:-translate-y-[1px]"
          title="Pesan ${Utils.sanitize(item.name)}"
        >+</button>
      </div>
    `,
      )
      .join("");

    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  return { renderTopMenu, orderTopMenu };
})();

window.dashSiswa = dashSiswa;
