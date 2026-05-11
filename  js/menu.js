// Data Layer (Nanti ganti dengan fetch ke API Node.js)
let menus = [
  { id:1,  name:'Nasi Goreng Spesial',   desc:'Pedas Sedang, Telur Ceplok',     cat:'food',  price:25000, active:true,  image:'https://picsum.photos/seed/nasgor/200/200' },
  { id:2,  name:'Ayam Goreng Kremes',    desc:'Paha/Dada, Sambal Bawang',       cat:'food',  price:22000, active:true,  image:'https://picsum.photos/seed/ayamkr/200/200' },
  { id:3,  name:'Mie Goreng Seafood',    desc:'Udang, Cumi, Bakso Ikan',        cat:'food',  price:28000, active:true,  image:'https://picsum.photos/seed/miegoreng/200/200' },
  { id:4,  name:'Soto Ayam Lamongan',    desc:'Kuah Bening, Koya Gurih',        cat:'food',  price:18000, active:true,  image:'https://picsum.photos/seed/sotoayam/200/200' },
  { id:5,  name:'Rendang Sapi',          desc:'Daging Sapi Empuk, Bumbu Padang',cat:'food',  price:32000, active:false, image:'https://picsum.photos/seed/rendang/200/200' },
  { id:6,  name:'Gado-gado Jakarta',     desc:'Sayuran Segar, Bumbu Kacang',    cat:'food',  price:15000, active:true,  image:'https://picsum.photos/seed/gadogado/200/200' },
  { id:7,  name:'Es Teh Manis',          desc:'Gula Murni, Es Kristal',         cat:'drink', price:5000,  active:true,  image:'https://picsum.photos/seed/esteh/200/200' },
  { id:8,  name:'Jus Jeruk Peras',       desc:'Jeruk Medan Asli, Tanpa Gula',   cat:'drink', price:15000, active:false, image:'https://picsum.photos/seed/jusjeruk/200/200' },
  { id:9,  name:'Es Kopi Susu',          desc:'Kopi Robusta, Susu Segar',       cat:'drink', price:18000, active:true,  image:'https://picsum.photos/seed/eskopi/200/200' },
  { id:10, name:'Teh Tarik',             desc:'Teh Ceylon, Susu Kental Manis',  cat:'drink', price:12000, active:true,  image:'https://picsum.photos/seed/tehtarik/200/200' },
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
      <tr class="${m.active ? '' : 'opacity-50'} hover:bg-surface-100/60 transition-colors">
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
          <label class="toggle-track" aria-label="Toggle ${m.name}">
            <input type="checkbox" ${m.active ? 'checked' : ''} onchange="toggleMenu(${m.id},this.checked)" />
            <span class="toggle-thumb"></span>
          </label>
        </td>
        <td class="px-7 py-4">
          <div class="flex justify-center gap-2">
            <button onclick="openEdit(${m.id})" class="w-8 h-8 rounded-lg border border-surface-500 flex items-center justify-center text-surface-700 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 transition-all" aria-label="Edit"><i class="ti ti-pencil text-sm"></i></button>
            <button onclick="openDel(${m.id})" class="w-8 h-8 rounded-lg border border-surface-500 flex items-center justify-center text-surface-700 hover:border-danger-500 hover:text-danger-500 hover:bg-red-50 transition-all" aria-label="Hapus"><i class="ti ti-trash text-sm"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  document.getElementById('footInfo').textContent = `Menampilkan ${showing} dari ${filtered.length} menu`;
  updateStats();
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
    b.classList.remove('bg-brand-50','border-brand-500','text-brand-500','font-bold');
    b.classList.add('border-surface-500','text-surface-900','bg-surface-100','font-semibold');
  });
  el.classList.add('bg-brand-50','border-brand-500','text-brand-500','font-bold');
  el.classList.remove('border-surface-500','text-surface-900','bg-surface-100','font-semibold');
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
  document.getElementById('uploadZone').classList.add('border-solid', 'border-surface-500');

  document.getElementById('modalOverlay').style.display = 'flex';
  setTimeout(() => document.getElementById('fName').focus(), 50);
}

function closeModal() { document.getElementById('modalOverlay').style.display = 'none'; }

function saveMenu() {
  const name = document.getElementById('fName').value.trim();
  const desc = document.getElementById('fDesc').value.trim();
  const cat = document.getElementById('fCat').value;
  const price = parseInt(document.getElementById('fPrice').value) || 0;
  
  if (!name) { document.getElementById('fName').focus(); return; }
  if (price <= 0) { document.getElementById('fPrice').focus(); return; }

  const imgToSave = currentImageData || `https://picsum.photos/seed/${name.replace(/\s/g,'')}/200/200`;

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

function closeDel() { document.getElementById('delOverlay').style.display = 'none'; }

function confirmDel() {
  menus = menus.filter(x => x.id !== deletingId);
  closeDel(); renderMenu();
  showToast('Menu berhasil dihapus', 'error');
}

// Event listener klik luar modal
document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('delOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeDel(); });