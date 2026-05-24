// Data Layer (Nanti ganti dengan fetch ke API Node.js)
let menus = [
  { id: 1, name: 'Nasi Goreng Spesial', desc: 'Pedas Sedang, Telur Ceplok', cat: 'food', price: 25000, active: true, image: './assets/images/nasi_goreng.png' },
  { id: 2, name: 'Ayam Goreng Kremes', desc: 'Paha/Dada, Sambal Bawang', cat: 'food', price: 22000, active: true, image: './assets/images/ayam_goreng.png' },
  { id: 3, name: 'Mie Goreng Seafood', desc: 'Udang, Cumi, Bakso Ikan', cat: 'food', price: 28000, active: true, image: 'https://picsum.photos/seed/miegoreng/200/200' },
  { id: 4, name: 'Soto Ayam Lamongan', desc: 'Kuah Bening, Koya Gurih', cat: 'food', price: 18000, active: true, image: 'https://picsum.photos/seed/sotoayam/200/200' },
  { id: 5, name: 'Rendang Sapi', desc: 'Daging Sapi Empuk, Bumbu Padang', cat: 'food', price: 32000, active: false, image: 'https://picsum.photos/seed/rendang/200/200' },
  { id: 6, name: 'Gado-gado Jakarta', desc: 'Sayuran Segar, Bumbu Kacang', cat: 'food', price: 15000, active: true, image: 'https://picsum.photos/seed/gadogado/200/200' },
  { id: 7, name: 'Es Teh Manis', desc: 'Gula Murni, Es Kristal', cat: 'drink', price: 5000, active: true, image: './assets/images/es_teh_manis.png' },
  { id: 8, name: 'Jus Jeruk Peras', desc: 'Jeruk Medan Asli, Tanpa Gula', cat: 'drink', price: 15000, active: false, image: './assets/images/jus_jeruk.png' },
  { id: 9, name: 'Es Kopi Susu', desc: 'Kopi Robusta, Susu Segar', cat: 'drink', price: 18000, active: true, image: 'https://picsum.photos/seed/eskopi/200/200' },
  { id: 10, name: 'Teh Tarik', desc: 'Teh Ceylon, Susu Kental Manis', cat: 'drink', price: 12000, active: true, image: 'https://picsum.photos/seed/tehtarik/200/200' },
];

let nextId = 11;
let filterCat = 'all';
let editingId = null;
let deletingId = null;
let page = 0;
const PER = 6;
let currentImageData = null;

function fmt(n) { return 'Rp ' + n.toLocaleString('id-ID'); }

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const colorClass = type === 'error' ? 'bg-red-600' : 'bg-brand-mid';
  toast.textContent = message;
  toast.className = `fixed bottom-6 right-6 z-50 ${colorClass} text-white font-bold text-xs p-3 px-5 rounded-xl border border-black/10 shadow-lg opacity-100 pointer-events-none transition-all duration-300`;
  setTimeout(() => {
    toast.classList.add('opacity-0');
  }, 2200);
}

function getFiltered() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  return menus.filter(m =>
    (filterCat === 'all' || m.cat === filterCat) &&
    (m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q))
  );
}

function renderMenu() {
  const filtered = getFiltered();
  const maxPage = Math.max(0, Math.ceil(filtered.length / PER) - 1);
  if (page > maxPage) page = maxPage;
  const slice = filtered.slice(page * PER, page * PER + PER);
  const showing = Math.min((page + 1) * PER, filtered.length);
  const tbody = document.getElementById('menuTbody');
  const empty = document.getElementById('emptyState');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    empty.classList.add('flex');
  } else {
    empty.classList.add('hidden');
    empty.classList.remove('flex');
    tbody.innerHTML = slice.map(m => `
      <tr style="${m.active ? '' : 'opacity:0.5;'} background-color:#EDE5D880;" class="hover:bg-brand-bg transition-colors">
        <td class="px-7 py-4">
          <div class="flex items-center gap-3.5">
            <img src="${m.image}" class="w-12 h-12 rounded-xl object-cover flex-shrink-0" style="border:1px solid #DDD0C4;background:#EDE5D8;" alt="${m.name}" onerror="this.src='https://picsum.photos/seed/fallback/200/200'" />
            <div class="min-w-0">
              <div class="font-bold truncate" style="font-size:13px;color:#4B3F38;">${m.name}</div>
              <div class="truncate mt-0.5" style="font-size:11px;color:#9E8E84;">${m.desc}</div>
            </div>
          </div>
        </td>
        <td class="px-7 py-4">
          <span class="inline-block px-3 py-1 rounded-lg font-bold" style="font-size:11px;${m.cat === 'food' ? 'background:#FEF3EC;color:#C05A1F;' : 'background:#EEF6FF;color:#3B82F6;'}">${m.cat === 'food' ? 'Food' : 'Drink'}</span>
        </td>
        <td class="px-7 py-4 text-center font-bold" style="font-size:14px;color:#4B3F38;">${fmt(m.price)}</td>
        <td class="px-7 py-4 text-center">
          <label class="toggle-track" aria-label="Toggle ${m.name}">
            <input type="checkbox" ${m.active ? 'checked' : ''} onchange="toggleMenu(${m.id},this.checked)" />
            <span class="toggle-thumb"></span>
          </label>
        </td>
        <td class="px-7 py-4">
          <div class="flex justify-center gap-2">
            <button onclick="openEdit(${m.id})" class="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style="border:1px solid #DDD0C4;background:#fff;color:#9E8E84;" onmouseover="this.style.borderColor='#C05A1F';this.style.color='#C05A1F';this.style.background='#fdf5ef';" onmouseout="this.style.borderColor='#DDD0C4';this.style.color='#9E8E84';this.style.background='#fff';" aria-label="Edit"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
            <button onclick="openDel(${m.id})" class="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style="border:1px solid #DDD0C4;background:#fff;color:#9E8E84;" onmouseover="this.style.borderColor='#ef4444';this.style.color='#ef4444';this.style.background='#fef2f2';" onmouseout="this.style.borderColor='#DDD0C4';this.style.color='#9E8E84';this.style.background='#fff';" aria-label="Hapus"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  document.getElementById('footInfo').textContent = `Menampilkan ${showing} dari ${filtered.length} menu`;
  updateStats();
  // Render Lucide icons in the dynamically generated table rows
  if (typeof lucide !== 'undefined') lucide.createIcons();
  // Bind modal outside-click listeners (safe: checks if elements exist + dedupes)
  bindModalListeners();
}

function updateStats() {
  document.getElementById('totalCount').textContent = menus.length;
  document.getElementById('foodCount').textContent = menus.filter(m => m.cat === 'food').length;
  document.getElementById('drinkCount').textContent = menus.filter(m => m.cat === 'drink').length;
  document.getElementById('emptyCount').textContent = menus.filter(m => !m.active).length;
}

function toggleMenu(id, val) {
  const m = menus.find(x => x.id === id);
  if (m) { m.active = val; renderMenu(); showToast(val ? 'Menu diaktifkan' : 'Menu dinonaktifkan', 'success'); }
}

function setFilter(cat, el) {
  filterCat = cat; page = 0;
  document.querySelectorAll('.filter-btn').forEach(b => {
    // inactive state
    b.style.background = '#F7F2EA';
    b.style.borderColor = '#DDD0C4';
    b.style.color = '#6B5E54';
    b.style.fontWeight = '600';
  });
  // active state for selected button
  el.style.background = '#FEF3EC';
  el.style.borderColor = '#C05A1F';
  el.style.color = '#C05A1F';
  el.style.fontWeight = '700';
  renderMenu();
}

function onSearch() { page = 0; renderMenu(); }

function changePage(dir) {
  const filtered = getFiltered();
  const max = Math.max(0, Math.ceil(filtered.length / PER) - 1);
  page = Math.max(0, Math.min(page + dir, max));
  renderMenu();
}

// ─── Image Handler ───
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file && file.size <= 2 * 1024 * 1024) { // Maks 2MB
    currentImageData = URL.createObjectURL(file);
    const preview = document.getElementById('fImagePreview');
    preview.src = currentImageData;
    preview.classList.remove('hidden');
    document.getElementById('fImagePlaceholder').classList.add('hidden');
    document.getElementById('btnRemoveImg').classList.remove('hidden');
    document.getElementById('uploadZone').classList.remove('border-dashed');
    document.getElementById('uploadZone').style.borderColor = '#C05A1F';
    document.getElementById('uploadZone').style.borderStyle = 'solid';
  } else if (file) {
    showToast('Ukuran gambar maksimal 2MB!', 'error');
    event.target.value = '';
  }
}

function removeImage() {
  currentImageData = null;
  document.getElementById('fImageFile').value = '';
  document.getElementById('fImagePreview').classList.add('hidden');
  document.getElementById('fImagePreview').src = '';
  document.getElementById('fImagePlaceholder').classList.remove('hidden');
  document.getElementById('btnRemoveImg').classList.add('hidden');
  document.getElementById('uploadZone').classList.add('border-dashed');
  document.getElementById('uploadZone').style.borderColor = '#DDD0C4';
  document.getElementById('uploadZone').style.borderStyle = 'dashed';
}

// ─── Modal CRUD ───
function openAdd() {
  editingId = null;
  document.getElementById('modalHeading').textContent = 'Tambah Menu Baru';
  document.getElementById('fName').value = '';
  document.getElementById('fDesc').value = '';
  document.getElementById('fCat').value = 'food';
  document.getElementById('fPrice').value = '';
  removeImage();
  document.getElementById('modalOverlay').style.display = 'flex';
  setTimeout(() => document.getElementById('fName').focus(), 50);
}

function openEdit(id) {
  const m = menus.find(x => x.id === id);
  editingId = id;
  document.getElementById('modalHeading').textContent = 'Edit Menu';
  document.getElementById('fName').value = m.name;
  document.getElementById('fDesc').value = m.desc;
  document.getElementById('fCat').value = m.cat;
  document.getElementById('fPrice').value = m.price;

  currentImageData = m.image;
  const preview = document.getElementById('fImagePreview');
  preview.src = m.image;
  preview.classList.remove('hidden');
  document.getElementById('fImagePlaceholder').classList.add('hidden');
  document.getElementById('btnRemoveImg').classList.remove('hidden');
  document.getElementById('uploadZone').classList.remove('border-dashed');
  document.getElementById('uploadZone').style.borderColor = '#C05A1F';
  document.getElementById('uploadZone').style.borderStyle = 'solid';

  document.getElementById('modalOverlay').style.display = 'flex';
  setTimeout(() => document.getElementById('fName').focus(), 50);
}

function closeModal() {
  const el = document.getElementById('modalOverlay');
  if (el) el.style.display = 'none';
}

function saveMenu() {
  const name = document.getElementById('fName').value.trim();
  const desc = document.getElementById('fDesc').value.trim();
  const cat = document.getElementById('fCat').value;
  const price = parseInt(document.getElementById('fPrice').value) || 0;

  if (!name) { document.getElementById('fName').focus(); return; }
  if (price <= 0) { document.getElementById('fPrice').focus(); return; }

  const imgToSave = currentImageData || `https://picsum.photos/seed/${name.replace(/\s/g, '')}/200/200`;

  if (editingId) {
    const m = menus.find(x => x.id === editingId);
    m.name = name; m.desc = desc; m.cat = cat; m.price = price; m.image = imgToSave;
    showToast('Menu berhasil diperbarui', 'success');
  } else {
    menus.push({ id: nextId++, name, desc, cat, price, active: true, image: imgToSave });
    showToast('Menu baru ditambahkan', 'success');
  }
  closeModal(); renderMenu();
}

function openDel(id) {
  deletingId = id;
  const m = menus.find(x => x.id === id);
  document.getElementById('delSub').textContent = `"${m.name}" akan dihapus secara permanen.`;
  document.getElementById('delOverlay').style.display = 'flex';
}

function closeDel() {
  const el = document.getElementById('delOverlay');
  if (el) el.style.display = 'none';
}

function confirmDel() {
  menus = menus.filter(x => x.id !== deletingId);
  closeDel(); renderMenu();
  showToast('Menu berhasil dihapus', 'error');
}

/**
 * Bind outside-click listeners for modals.
 * Called by renderMenu() after the DOM is injected, so elements are guaranteed to exist.
 */
function bindModalListeners() {
  const modalOverlay = document.getElementById('modalOverlay');
  const delOverlay = document.getElementById('delOverlay');
  if (modalOverlay && !modalOverlay._bound) {
    modalOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
    modalOverlay._bound = true;
  }
  if (delOverlay && !delOverlay._bound) {
    delOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) closeDel(); });
    delOverlay._bound = true;
  }
}
