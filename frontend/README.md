# 📦 Frontend — telFood

Frontend untuk aplikasi **telFood**, sistem pemesanan makanan kantin kampus berbasis web. Dibangun dengan HTML, CSS (Tailwind), dan Vanilla JavaScript tanpa framework.

---

## 🚀 Cara Menjalankan

### 1. Install dependencies
```bash
npm install
```

### 2. Build Tailwind CSS (mode watch)
```bash
npm run dev
```

### 3. Jalankan development server
```bash
npm run serve
```
> Akses di `http://localhost:8080`

---

## 📁 Struktur Folder

```
frontend/
├── package.json
├── package-lock.json
│
├── src/
│   ├── index.html              
│   ├── input.css               
│   ├── output.css              
│   │
│   ├── assets/                 
│   │   └── auth-bg.png
│   │
│   ├── partials/               
│   │   └── sidebar.html        
│   │
│   ├── pages/                  
│   │   ├── auth/
│   │   │   ├── login.html      
│   │   │   └── register.html   
│   │   ├── siswa/
│   │   │   ├── dashSiswa.html  
│   │   │   └── booking.html    
│   │   ├── owner/
│   │   │   ├── dashboard.html 
│   │   │   ├── edit-menu.html  
│   │   │   └── update_status.html  
│   │   └── account/
│   │       ├── owner.html     
│   │       └── siswa.html     
│   │
│   └── js/
│       ├── api.js              
│       ├── account.js          
│       ├── shared/
│       │   ├── menuTable.js
│       │   ├── orderStatusMeta.js
│       │   ├── renderCollection.js
│       │   └── utils.js
│       ├── siswa/              
│       │   ├── booking.js      
│       │   ├── cart.js         
│       │   ├── dashSiswa.js    
│       │   ├── orderStateMachine.js  
│       │   └── ui.js          
│       └── owner/
│           └── edit-menu.js    
│
└── test/
    └── syntax.test.js          
```

---

## 🧠 Arsitektur

Aplikasi ini adalah **Single Page Application (SPA) sederhana** tanpa framework. Navigasi antar halaman dilakukan dengan cara:

1. User klik link navigasi di sidebar
2. `index.html` fetch file HTML partial yang sesuai
3. Partial di-inject ke dalam `#main-content`
4. Script inisialisasi dipanggil untuk halaman tersebut

```
index.html  loadPage()──►  fetch partial HTML
                │
                ▼
         #main-content (di-replace setiap ganti halaman)
                │
     ┌──────────┴──────────┐
     │                     │
pages/siswa/          pages/owner/
booking.html          dashboard.html
dashSiswa.html        edit-menu.html
                      update_status.html
```

> **Catatan penting:** Elemen yang harus persisten antar navigasi (seperti `#orderStatusOverlay`) **harus diletakkan di `index.html`**, bukan di dalam partial — karena `#main-content` di-replace setiap kali ganti halaman.

---

## 🔌 Modul JavaScript

### `api.js` ApiClient
Wrapper untuk semua komunikasi dengan backend. Mengelola token JWT di `localStorage`.

```js
ApiClient.login(email, password)
ApiClient.getKantins()
ApiClient.getMenus({ kantin_id, available })
ApiClient.createOrder({ kantin_id, customer_name, items })
ApiClient.listMyOrders()
ApiClient.getOrder(id)
ApiClient.updateOrderStatus(id, status)
```

---

### `shared/utils.js` Utils
Helper fungsi umum yang dipakai di seluruh modul.

| Fungsi | Kegunaan |
|---|---|
| `formatRupiah(amount)` | Format angka ke `Rp 15.000` |
| `sanitize(str)` | Escape HTML untuk cegah XSS |
| `generateOrderId()` | Generate ID order acak (mode offline) |
| `validateNama(nama)` | Validasi input nama pelanggan |

---

### `shared/menuTable.js` MenuTable
Cache in-memory untuk data menu dan kantin dari API.

```js
MenuTable.loadFromApi()             
MenuTable.getKantinList()           
MenuTable.getMenuByKantin(kantinId) 
MenuTable.findMenuItemById(id)      
MenuTable.getTopMenu()              
MenuTable.isApiBacked()             
```

---

### `siswa/cart.js` Cart
Manajemen state keranjang belanja (in-memory, reset saat halaman reload).

```js
Cart.addItem(menuItem)    
Cart.removeItem(id)       
Cart.getItems()           
Cart.getTotal()           
Cart.isEmpty()            
Cart.clearCart()          
```

---

### `siswa/orderStateMachine.js` OrderStateMachine
State machine untuk tracking status pesanan aktif.

```
IDLE → ORDERED → COOKING → READY → DONE
```

```js
OrderStateMachine.transition(state)   
OrderStateMachine.forceState(state)   
OrderStateMachine.getState()          
OrderStateMachine.getStepStatus(step) 
OrderStateMachine.reset()             
```

---

### `siswa/ui.js` UI
Komponen UI shared untuk halaman siswa.

```js
UI.renderOrderStatus(orderId, summary, total)  
UI.hideOrderStatus()                           
UI.toggleOrderStatus()                         
UI.updateEstimasiWaktu()                       
UI.renderOrderItems()                          
UI.renderMenuGrid(kantinId)                    
```

---

### `siswa/booking.js` booking
Logic spesifik halaman pemesanan.

```js
booking.renderKantinSelect()        
booking.renderMenuGrid(kantinId)    
booking.renderOrderItems()          
```

---

### `account.js` AccountPage
Mengelola halaman profil pengguna (Siswa & Pemilik Kantin), penanganan unggah/hapus foto profil, data info kantin, daftar riwayat pesanan (siswa), notifikasi, dan data omzet/statistik transaksi (owner).

```js
AccountPage.init()              // Inisialisasi halaman profil Siswa/Pelanggan
AccountPage.initOwner()         // Inisialisasi halaman profil Owner/Penjual
AccountPage.addNotification(n)  // Menambahkan notifikasi baru ke localStorage
AccountPage.renderNotifications()// Merender daftar notifikasi ke UI
AccountPage.syncProfilePhoto()  // Menyelaraskan foto profil di header dan sidebar
```

---

### `siswa/dashSiswa.js` dashSiswa
Mengelola tampilan beranda/dashboard pelanggan, termasuk menampilkan rekomendasi menu terpopuler.

```js
dashSiswa.renderTopMenu()              // Render grid menu terpopuler di dashboard
dashSiswa.orderTopMenu(kantinId, id)   // Navigasi ke pemesanan & otomatis masukkan menu ke keranjang
```

---

### `owner/edit-menu.js` EditMenu (Manajemen Menu)
Mengelola CRUD menu makanan/minuman pemilik kantin, filter pencarian menu, pagination, toggle ketersediaan menu, pengunggahan foto menu, dan sinkronisasi real-time.

```js
window.renderMenu()          // Memuat seluruh menu dari API & merender tabel manajemen menu
window.openAdd()             // Membuka modal tambah menu baru
window.openEdit(id)          // Membuka modal edit data menu berdasarkan ID
window.closeModal()          // Menutup modal form tambah/edit menu
window.saveMenu()            // Mengirim payload penambahan/pembaruan menu ke API
window.openDel(id)           // Membuka modal konfirmasi hapus menu
window.closeDel()            // Menutup modal konfirmasi hapus
window.confirmDel()          // Mengirim request penghapusan menu ke API
window.changePage(direction) // Navigasi halaman tabel (pagination)
window.setFilter(category,el)// Memfilter tampilan menu berdasarkan kategori (makanan/minuman/semua)
window.onSearch()            // Menyaring tampilan berdasarkan input kata kunci pencarian
window.toggleMenu(id, val)   // Mengubah status ketersediaan (aktif/nonaktif) menu
```

---

### `shared/orderStatusMeta.js` OrderStatusMeta
Metadata helper untuk menerjemahkan status pesanan (baik integer status dari websocket maupun string status) menjadi gaya styling CSS & label yang rapi.

---

### `shared/renderCollection.js` renderCollection
Helper utilitas untuk rendering list koleksi HTML secara dinamis.

---

## 🔄 Real-time Update

Aplikasi menggunakan **Socket.io** (terhubung ke backend) untuk menerima update status pesanan secara real-time.

| Event | Trigger | Aksi di FE |
|---|---|---|
| `order:status` | Penjual ubah status pesanan | Update `OrderStateMachine`, re-render popup status, update estimasi waktu |
| `menu:updated` | Penjual ubah/tambah/hapus menu | Reload `MenuTable`, refresh grid menu di halaman booking |

---

## 🎨 Styling

Menggunakan **Tailwind CSS v4** dengan konfigurasi custom:

| Token | Nilai | Kegunaan |
|---|---|---|
| `bg-[#F4EFE2]` | Krem muda | Background card & input |
| `bg-[#D4622A]` | Oranye | Warna primary (tombol, aksen) |
| `bg-[#2D2D2D]` | Gelap | Teks utama |
| `text-gray-400` | Abu | Teks sekunder / placeholder |

Build CSS:
```bash
npm run dev   
```

Output di `src/output.css` **jangan diedit manual**, file ini auto-generated.