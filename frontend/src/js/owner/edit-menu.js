/**
 * edit-menu.js – Manajemen menu penjual, tersambung penuh ke backend API.
 *
 * Flow:
 *  1. renderMenu() → load dari ApiClient.getMenus({ kantin_id })
 *  2. saveMenu()   → ApiClient.createMenu() / ApiClient.updateMenu()
 *  3. confirmDel() → ApiClient.deleteMenu()
 *  4. toggleMenu() → ApiClient.updateMenu(id, { available })
 *
 * Seluruh perubahan langsung ter-emit ke pelanggan via socket.io (menu:updated)
 * yang dihandle di backend menuController.js.
 */

// ─── State ────────────────────────────────────────────────────────────────────
let menus = [];
let filterCat = "all";
let editingId = null;
let deletingId = null;
let page = 0;
const PER = 6;
let currentImageData = null;

// ─── Helper ───────────────────────────────────────────────────────────────────
function fmt(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  const colorClass = type === "error" ? "bg-red-600" : "bg-brand-mid";
  toast.textContent = message;
  toast.className = `fixed bottom-6 right-6 z-50 ${colorClass} text-white font-bold text-xs p-3 px-5 rounded-xl border border-black/10 shadow-lg opacity-100 pointer-events-none transition-all duration-300`;
  setTimeout(() => {
    toast.classList.add("opacity-0");
    toast.classList.remove("opacity-100");
  }, 2500);
}

/** Map API menu object → local format yang dipakai render */
function mapApiMenu(m) {
  // Deteksi kategori dari emoji: 🥤/☕/🧃 → drink, sisanya → food
  const drinkEmojis = ["🥤", "☕", "🧃", "🍵", "🧋", "🍹", "🥛"];
  const cat =
    m.emoji && drinkEmojis.includes(m.emoji.trim()) ? "drink" : "food";
  return {
    id: m.id,
    kantin_id: m.kantin_id,
    name: m.name,
    desc: m.description || "",
    cat,
    price: m.price,
    active: m.available,
    emoji: m.emoji || "",
  };
}

/** Muat menu dari API berdasarkan kantin_id user yang login */
async function loadMenusFromApi() {
  if (!window.ApiClient || !ApiClient.isAuthenticated()) return;
  const user = ApiClient.getUser();
  if (!user || !user.kantin_id) {
    console.warn("[edit-menu] User tidak punya kantin_id, skip load API");
    return;
  }
  try {
    const data = await ApiClient.getMenus({ kantin_id: user.kantin_id });
    menus = data.map(mapApiMenu);
  } catch (err) {
    console.error("[edit-menu] Gagal load menu:", err.message);
    showToast("Gagal memuat menu: " + err.message, "error");
  }
}

// ─── Filter & Pagination ─────────────────────────────────────────────────────
function getFiltered() {
  const searchInput = document.getElementById("searchInput");
  const q = searchInput ? searchInput.value.toLowerCase() : "";
  return menus.filter(
    (m) =>
      (filterCat === "all" || m.cat === filterCat) &&
      (m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)),
  );
}

// ─── Render ───────────────────────────────────────────────────────────────────
function _doRender() {
  const filtered = getFiltered();
  const maxPage = Math.max(0, Math.ceil(filtered.length / PER) - 1);
  if (page > maxPage) page = maxPage;
  const slice = filtered.slice(page * PER, page * PER + PER);
  const showing = Math.min((page + 1) * PER, filtered.length);
  const tbody = document.getElementById("menuTbody");
  const empty = document.getElementById("emptyState");
  console.log(slice)
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    empty && empty.classList.remove("hidden") && empty.classList.add("flex");
  } else {
    empty && empty.classList.add("hidden") && empty.classList.remove("flex");
    tbody.innerHTML = slice
      .map(
        (m) => `
      <tr style="${m.active ? "" : "opacity:0.5;"} background-color:#EDE5D880;" class="hover:bg-brand-bg transition-colors">
        <td class="px-7 py-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl" style="border:1px solid #DDD0C4;background:#EDE5D8;">
              ${m.emoji || (m.cat === "drink" ? "🥤" : "🍛")}
            </div>
            <div class="min-w-0">
              <div class="font-bold truncate" style="font-size:13px;color:#4B3F38;">${m.name}</div>
              <div class="truncate mt-0.5" style="font-size:11px;color:#9E8E84;">${m.desc || "—"}</div>
            </div>
          </div>
        </td>
        <td class="px-7 py-4 text-center">
          <span class="inline-block px-3 py-1 rounded-lg font-bold" style="font-size:11px;${m.cat === "food" ? "background:#FEF3EC;color:#C05A1F;" : "background:#EEF6FF;color:#3B82F6;"}">${m.cat === "food" ? "Makanan" : "Minuman"}</span>
        </td>
        <td class="px-7 py-4 text-right font-bold" style="font-size:14px;color:#4B3F38;">${fmt(m.price)}</td>
        <td class="px-7 py-4 text-center">
          <label class="toggle-track" aria-label="Toggle ${m.name}">
            <input type="checkbox" ${m.active ? "checked" : ""} onchange="toggleMenu(${m.id}, this.checked)" />
            <span class="toggle-thumb"></span>
          </label>
        </td>
        <td class="px-7 py-4">
          <div class="flex justify-center gap-2">
            <button onclick="openEdit(${m.id})" class="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style="border:1px solid #DDD0C4;background:#fff;color:#9E8E84;" onmouseover="this.style.borderColor='#C05A1F';this.style.color='#C05A1F';this.style.background='#fdf5ef';" onmouseout="this.style.borderColor='#DDD0C4';this.style.color='#9E8E84';this.style.background='#fff';" aria-label="Edit">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button onclick="openDel(${m.id})" class="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style="border:1px solid #DDD0C4;background:#fff;color:#9E8E84;" onmouseover="this.style.borderColor='#ef4444';this.style.color='#ef4444';this.style.background='#fef2f2';" onmouseout="this.style.borderColor='#DDD0C4';this.style.color='#9E8E84';this.style.background='#fff';" aria-label="Hapus">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `,
      )
      .join("");
  }

  const footInfo = document.getElementById("footInfo");
  if (footInfo)
    footInfo.textContent = `Menampilkan ${showing} dari ${filtered.length} menu`;
  updateStats();
  if (typeof lucide !== "undefined") lucide.createIcons();
  bindModalListeners();
}

function updateStats() {
  if (!document.getElementById("totalCount")) return;
  document.getElementById("totalCount").textContent = menus.length;
  document.getElementById("foodCount").textContent = menus.filter(
    (m) => m.cat === "food",
  ).length;
  document.getElementById("drinkCount").textContent = menus.filter(
    (m) => m.cat === "drink",
  ).length;
  document.getElementById("emptyCount").textContent = menus.filter(
    (m) => !m.active,
  ).length;
}

// ─── Toggle Ketersediaan ──────────────────────────────────────────────────────
async function toggleMenu(id, val) {
  const m = menus.find((x) => x.id === id);
  if (!m) return;

  const prevActive = m.active;
  m.active = val; // optimistic update
  _doRender();

  try {
    await ApiClient.updateMenu(id, { available: val });
    showToast(val ? "Menu diaktifkan ✓" : "Menu dinonaktifkan ✓", "success");
  } catch (err) {
    // rollback
    m.active = prevActive;
    _doRender();
    showToast("Gagal update: " + err.message, "error");
  }
}

// ─── Filter ───────────────────────────────────────────────────────────────────
function setFilter(cat, el) {
  filterCat = cat;
  page = 0;
  document.querySelectorAll(".filter-btn").forEach((b) => {
    b.style.background = "#F7F2EA";
    b.style.borderColor = "#DDD0C4";
    b.style.color = "#6B5E54";
    b.style.fontWeight = "600";
  });
  el.style.background = "#FEF3EC";
  el.style.borderColor = "#C05A1F";
  el.style.color = "#C05A1F";
  el.style.fontWeight = "700";
  _doRender();
}

function onSearch() {
  page = 0;
  _doRender();
}

function changePage(dir) {
  const filtered = getFiltered();
  const max = Math.max(0, Math.ceil(filtered.length / PER) - 1);
  page = Math.max(0, Math.min(page + dir, max));
  _doRender();
}

// ─── Image Handler ────────────────────────────────────────────────────────────
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file && file.size <= 2 * 1024 * 1024) {
    currentImageData = URL.createObjectURL(file);
    const preview = document.getElementById("fImagePreview");
    preview.src = currentImageData;
    preview.classList.remove("hidden");
    document.getElementById("fImagePlaceholder").classList.add("hidden");
    document.getElementById("btnRemoveImg").classList.remove("hidden");
    document.getElementById("uploadZone").classList.remove("border-dashed");
    document.getElementById("uploadZone").style.borderColor = "#C05A1F";
    document.getElementById("uploadZone").style.borderStyle = "solid";
  } else if (file) {
    showToast("Ukuran gambar maksimal 2MB!", "error");
    event.target.value = "";
  }
}

function removeImage() {
  currentImageData = null;
  document.getElementById("fImageFile").value = "";
  document.getElementById("fImagePreview").classList.add("hidden");
  document.getElementById("fImagePreview").src = "";
  document.getElementById("fImagePlaceholder").classList.remove("hidden");
  document.getElementById("btnRemoveImg").classList.add("hidden");
  document.getElementById("uploadZone").classList.add("border-dashed");
  document.getElementById("uploadZone").style.borderColor = "#DDD0C4";
  document.getElementById("uploadZone").style.borderStyle = "dashed";
}

// ─── Modal CRUD ───────────────────────────────────────────────────────────────
function openAdd() {
  editingId = null;
  const heading = document.getElementById("modalHeading");
  if (!heading) return;
  heading.textContent = "Tambah Menu Baru";
  document.getElementById("fName").value = "";
  document.getElementById("fDesc").value = "";
  document.getElementById("fCat").value = "food";
  document.getElementById("fPrice").value = "";
  document.getElementById("fEmoji").value = "";
  removeImage();
  document.getElementById("modalOverlay").style.display = "flex";
  setTimeout(() => document.getElementById("fName").focus(), 50);
}

function openEdit(id) {
  const m = menus.find((x) => x.id === id);
  if (!m) return;
  editingId = id;
  document.getElementById("modalHeading").textContent = "Edit Menu";
  document.getElementById("fName").value = m.name;
  document.getElementById("fDesc").value = m.desc;
  document.getElementById("fCat").value = m.cat;
  document.getElementById("fPrice").value = m.price;
  document.getElementById("fEmoji").value = m.emoji || "";

  // Emoji preview sebagai pengganti image
  currentImageData = null;
  removeImage();

  document.getElementById("modalOverlay").style.display = "flex";
  setTimeout(() => document.getElementById("fName").focus(), 50);
}

function closeModal() {
  const modalOverlay = document.getElementById("modalOverlay");

  if (!modalOverlay) {
    console.error("Modal overlay element not found!");
    return;
  }
  modalOverlay.style.display = "none";
  modalOverlay.classList.add("hidden");
}

async function saveMenu() {
  const name = document.getElementById("fName").value.trim();
  const desc = document.getElementById("fDesc").value.trim();
  const cat = document.getElementById("fCat").value;
  const price = parseInt(document.getElementById("fPrice").value) || 0;
  const emoji =
    document.getElementById("fEmoji").value.trim() ||
    (cat === "drink" ? "🥤" : "🍛");

  if (!name) {
    document.getElementById("fName").focus();
    return;
  }
  if (price <= 0) {
    document.getElementById("fPrice").focus();
    return;
  }

  const user = ApiClient.getUser();
  if (!user || !user.kantin_id) {
    showToast("User tidak terhubung ke kantin!", "error");
    return;
  }

  const saveBtn = document.querySelector('[onclick="saveMenu()"]');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Menyimpan...";
  }

  try {
    if (editingId) {
      // UPDATE
      const payload = {
        name,
        description: desc,
        price,
        emoji,
        available: true,
      };
      const updated = await ApiClient.updateMenu(editingId, payload);
      const idx = menus.findIndex((x) => x.id === editingId);
      if (idx >= 0) menus[idx] = mapApiMenu(updated);
      showToast("Menu berhasil diperbarui ✓", "success");
    } else {
      // CREATE
      const payload = {
        kantin_id: user.kantin_id,
        name,
        description: desc,
        price,
        emoji,
        available: true,
        category_id: cat, // diterima validator, diabaikan di controller
      };
      const created = await ApiClient.createMenu(payload);
      menus.push(mapApiMenu(created));
      showToast("Menu baru ditambahkan ✓", "success");
    }
    closeModal();
    _doRender();
  } catch (err) {
    showToast("Gagal menyimpan: " + err.message, "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Simpan";
    }
  }
}

// ─── Hapus ────────────────────────────────────────────────────────────────────
function openDel(id) {
  deletingId = id;
  const m = menus.find((x) => x.id === id);
  if (!m) return;
  document.getElementById("delSub").textContent =
    `"${m.name}" akan dihapus secara permanen.`;
  document.getElementById("delOverlay").style.display = "flex";
}

function closeDel() {
  const el = document.getElementById("delOverlay");
  if (el) el.style.display = "none";
}

async function confirmDel() {
  if (!deletingId) return;
  const delBtn = document.querySelector('[onclick="confirmDel()"]');
  if (delBtn) {
    delBtn.disabled = true;
    delBtn.textContent = "Menghapus...";
  }
  try {
    await ApiClient.deleteMenu(deletingId);
    menus = menus.filter((x) => x.id !== deletingId);
    closeDel();
    _doRender();
    showToast("Menu berhasil dihapus", "error");
  } catch (err) {
    showToast("Gagal hapus: " + err.message, "error");
  } finally {
    if (delBtn) {
      delBtn.disabled = false;
      delBtn.textContent = "Ya, Hapus";
    }
    deletingId = null;
  }
}

// ─── Bind modal outside-click ─────────────────────────────────────────────────
function bindModalListeners() {
  const modalOverlay = document.getElementById("modalOverlay");
  const delOverlay = document.getElementById("delOverlay");
  if (modalOverlay && !modalOverlay._bound) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
    modalOverlay._bound = true;
  }
  if (delOverlay && !delOverlay._bound) {
    delOverlay.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeDel();
    });
    delOverlay._bound = true;
  }
}

// ─── Init (dipanggil dari index.html saat owner-menu dimuat) ─────────────────
window.renderMenu = async function () {
  if (document.getElementById("menuTbody")) {
    await loadMenusFromApi();
    _doRender();
  }
};

// DOMContentLoaded fallback jika halaman dibuka langsung
window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("menuTbody")) window.renderMenu();
});
