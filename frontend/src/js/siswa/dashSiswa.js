const dashSiswa = (() => {

  // Inline SVG icons (no external dependency needed)
  const foodIcons = [
    // cooking-pot
    `<svg class="w-12 h-12 text-[#D4622A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M4 12a8 8 0 0 1 16 0"/><path d="M12 2v3"/><path d="M9.5 2.5 12 5l2.5-2.5"/></svg>`,
    // bowl with utensils (soup)
    `<svg class="w-12 h-12 text-[#D4622A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 0 1-8.45-4.6"/><path d="M2.55 13.4A10 10 0 0 1 12 2a10 10 0 0 1 9.45 6.4"/><path d="M2 12h20"/><path d="M8 8v1"/><path d="M12 8v1"/><path d="M16 8v1"/></svg>`,
    // salad/plate
    `<svg class="w-12 h-12 text-[#D4622A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M20 12c0 5.52-3.58 10-8 10S4 17.52 4 12"/><path d="M15 5a3 3 0 0 0-6 0"/><path d="M12 2v3"/></svg>`,
  ];

  function renderTopMenu() {
    const container = document.getElementById('topMenuGrid');

    if (!container) {
      console.error('Container for top menu not found');
      return;
    }

    const topMenus = MenuTable.getTopMenu();

    container.innerHTML = topMenus.map((item, i) => `
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
          onclick="loadPage('booking')"
          class="bg-[#D4622A] hover:bg-[#bb5422] text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xl font-bold transition hover:-translate-y-[1px]"
          title="Pesan"
        >+</button>
      </div>
    `).join('');
  }

  return { renderTopMenu };

})();

window.dashSiswa = dashSiswa;
