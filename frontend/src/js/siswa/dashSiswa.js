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
          onclick="loadPage('siswa-booking')"
          class="bg-[#D4622A] hover:bg-[#bb5422] text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xl font-bold transition hover:-translate-y-[1px]"
          title="Pesan"
        >+</button>
      </div>
    `,
      )
      .join("");
  }

  return { renderTopMenu };
})();

window.dashSiswa = dashSiswa;
