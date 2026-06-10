/**
 * renderCollection
 *
 * Parameterization / generics sederhana untuk vanilla JavaScript.
 * Fungsi ini tidak bergantung pada domain tertentu, sehingga bisa dipakai ulang
 * untuk render riwayat pesanan, notifikasi, daftar menu, dan list lain.
 */
function renderCollection(target, items, renderItem, emptyHtml) {
  const container =
    typeof target === "string" ? document.getElementById(target) : target;
  if (!container) return;

  const safeItems = Array.isArray(items) ? items : [];
  container.innerHTML = safeItems.length
    ? safeItems.map((item, index) => renderItem(item, index)).join("")
    : emptyHtml;
}

window.renderCollection = renderCollection;
