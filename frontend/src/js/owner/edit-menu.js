// Data Layer (Nanti ganti dengan fetch ke API Node.js)
let menus = [
  { id: 1, name: 'Nasi Goreng Spesial', desc: 'Pedas Sedang, Telur Ceplok', cat: 'food', price: 25000, active: true, image: 'assets/nasi_goreng.png' },
  { id: 2, name: 'Ayam Goreng Kremes', desc: 'Paha/Dada, Sambal Bawang', cat: 'food', price: 22000, active: true, image: 'assets/ayam_goreng.png' },
  { id: 3, name: 'Mie Goreng Seafood', desc: 'Udang, Cumi, Bakso Ikan', cat: 'food', price: 28000, active: true, image: 'https://picsum.photos/seed/miegoreng/200/200' },
  { id: 4, name: 'Soto Ayam Lamongan', desc: 'Kuah Bening, Koya Gurih', cat: 'food', price: 18000, active: true, image: 'https://picsum.photos/seed/sotoayam/200/200' },
  { id: 5, name: 'Rendang Sapi', desc: 'Daging Sapi Empuk, Bumbu Padang', cat: 'food', price: 32000, active: false, image: 'https://picsum.photos/seed/rendang/200/200' },
  { id: 6, name: 'Gado-gado Jakarta', desc: 'Sayuran Segar, Bumbu Kacang', cat: 'food', price: 15000, active: true, image: 'https://picsum.photos/seed/gadogado/200/200' },
  { id: 7, name: 'Es Teh Manis', desc: 'Gula Murni, Es Kristal', cat: 'drink', price: 5000, active: true, image: 'assets/es_teh_manis.png' },
  { id: 8, name: 'Jus Jeruk Peras', desc: 'Jeruk Medan Asli, Tanpa Gula', cat: 'drink', price: 15000, active: false, image: 'assets/jus_jeruk.png' },
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

function getFiltered() {
  const q = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';
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
      <tr id="row-${m.id}" class="${m.active ? '' : 'opacity-50'} hover:bg-surface-100/60 transition-colors">
        <td class="px-7 py-4">
          <div class="flex items-center gap-3.5">
            <img src="${m.image}" class="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-surface-400 bg-surface-200" alt="${m.name}" onerror="this.src='https://picsum.photos/seed/fallback/200/200'" />
            <div class="min-w-0">
              <div class="font-bold text-[13px] text-surface-1000 truncate">${m.name}</div>
              <div class="text-[11px] text-surface-700 mt-0.5 truncate">${m.desc}</div>
            </div>
          </div>
        </td>
        <td class="px-7 py-4">
          <span class="inline-block px-3 py-1 rounded-lg text-[11px] font-bold ${m.cat === 'food' ? 'bg-brand-50 text-brand-500' : 'bg-info-100 text-info-500'}">${m.cat === 'food' ? 'Food' : 'Drink'}</span>
        </td>
        <td class="px-7 py-4 text-center font-bold text-[14px] text-surface-1000">${fmt(m.price)}</td>
        <td class="px-7 py-4 text-center">
          <label class="relative inline-flex items-center cursor-pointer" aria-label="Toggle ${m.name}">
            <input type="checkbox" class="sr-only peer" ${m.active ? 'checked' : ''} onchange="toggleMenu(${m.id},this.checked)" />
            <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#C05A1F]/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C05A1F]"></div>
          </label>
        </td>
        <td class="px-7 py-4">
          <div class="flex justify-center gap-2">
            <button onclick="openEdit(${m.id})" class="w-8 h-8 rounded-lg border border-surface-500 flex items-center justify-center text-surface-700 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 transition-all" aria-label="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button onclick="openDel(${m.id})" class="w-8 h-8 rounded-lg border border-surface-500 flex items-center justify-center text-surface-700 hover:border-danger-500 hover:text-danger-500 hover:bg-red-50 transition-all" aria-label="Hapus">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  document.getElementById('footInfo').textContent = `Menampilkan ${showing} dari ${filtered.length} menu`;
  updateMenuStats();
}

function updateMenuStats() {
  document.getElementById('totalCount').textContent = menus.length;
  document.getElementById('foodCount').textContent = menus.filter(m => m.cat === 'food').length;
  document.getElementById('drinkCount').textContent = menus.filter(m => m.cat === 'drink').length;
  document.getElementById('emptyCount').textContent = menus.filter(m => !m.active).length;
}

function toggleMenu(id, val) {
  const m = menus.find(x => x.id === id);
  if (m) { 
    m.active = val; 
    const row = document.getElementById(`row-${id}`);
    if (row) {
      if (val) row.classList.remove('opacity-50');
      else row.classList.add('opacity-50');
    }
    updateMenuStats(); 
    showToast(val ? 'Menu diaktifkan' : 'Menu dinonaktifkan', 'success'); 
  }
}

function setFilter(cat, el) {
  filterCat = cat; page = 0;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('bg-brand-50', 'border-brand-500', 'text-brand-500', 'font-bold');
    b.classList.add('border-surface-500', 'text-surface-900', 'bg-surface-100', 'font-semibold');
  });
  el.classList.add('bg-brand-50', 'border-brand-500', 'text-brand-500', 'font-bold');
  el.classList.remove('border-surface-500', 'text-surface-900', 'bg-surface-100', 'font-semibold');
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
    document.getElementById('uploadZone').classList.add('border-solid', 'border-brand-500');
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
  document.getElementById('uploadZone').classList.remove('border-solid', 'border-brand-500');
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
  document.getElementById('modalOverlay').classList.remove('hidden');
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
  document.getElementById('uploadZone').classList.add('border-solid', 'border-surface-500');

  document.getElementById('modalOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('fName').focus(), 50);
}

function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); }

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
  document.getElementById('delOverlay').classList.remove('hidden');
}

function closeDel() { document.getElementById('delOverlay').classList.add('hidden'); }

function confirmDel() {
  menus = menus.filter(x => x.id !== deletingId);
  closeDel(); renderMenu();
  showToast('Menu berhasil dihapus', 'error');
}
