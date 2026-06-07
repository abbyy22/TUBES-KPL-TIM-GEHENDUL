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
│   ├── index.html              # Entry point utama — shell SPA (sidebar + content area)
│   ├── input.css               # Source Tailwind CSS
│   ├── output.css              # Tailwind CSS hasil build (auto-generated)
│   │
│   ├── assets/                 # Static assets
│   │   ├── profile.png
│   │   ├── auth-bg.png
│   │   ├── avatars/
│   │   │   └── profile.png
│   │   └── images/             # Gambar menu makanan
│   │       ├── nasi_goreng.png
│   │       ├── ayam_goreng.png
│   │       ├── es_teh_manis.png
│   │       └── jus_jeruk.png
│   │
│   ├── partials/               # Komponen HTML yang di-inject secara dinamis
│   │   └── sidebar.html        # Sidebar navigasi (dimuat satu kali saat app init)
│   │
│   ├── pages/                  # Halaman-halaman partial (di-inject ke #main-content)
│   │   ├── auth/
│   │   │   ├── login.html      # Halaman login
│   │   │   └── register.html   # Halaman registrasi
│   │   ├── siswa/
│   │   │   ├── dashSiswa.html  # Dashboard siswa — top menu & akses cepat pesan
│   │   │   └── booking.html    # Halaman form pemesanan + grid menu kantin
│   │   ├── owner/
│   │   │   ├── dashboard.html  # Dashboard penjual — statistik transaksi
│   │   │   ├── edit-menu.html  # Manajemen menu (tambah/edit/hapus)
│   │   │   └── update_status.html  # Kanban board status pesanan
│   │   └── account/
│   │       └── index.html      # Halaman profil & riwayat pesanan
│   │
│   └── js/
│       ├── api.js              # ApiClient — wrapper semua request ke backend REST API
│       │
│       ├── siswa/              # Modul JS khusus alur siswa/pelanggan
│       │   ├── utils.js        # Helper umum (formatRupiah, sanitize, generateOrderId, validasi)
│       │   ├── menuTable.js    # Cache data menu & kantin dari API
│       │   ├── cart.js         # State keranjang belanja (tambah, kurangi, clear)
│       │   ├── orderStateMachine.js  # State machine pesanan (IDLE→ORDERED→COOKING→READY→DONE)
│       │   ├── booking.js      # Logic halaman booking (render select kantin, grid menu, item order)
│       │   ├── dashSiswa.js    # Logic dashboard siswa (render top menu)
│       │   └── ui.js           # Komponen UI shared (renderOrderStatus, toggle overlay, estimasi waktu)
│       │
│       └── owner/
│           └── edit-menu.js    # Logic manajemen menu penjual (CRUD, upload gambar)
│
└── test/
    └── syntax.test.js          # Syntax check dasar untuk file JS
```

---

## 🧠 Arsitektur

Aplikasi ini adalah **Single Page Application (SPA) sederhana** tanpa framework. Navigasi antar halaman dilakukan dengan cara:

1. User klik link navigasi di sidebar
2. `index.html` fetch file HTML partial yang sesuai
3. Partial di-inject ke dalam `#main-content`
4. Script inisialisasi dipanggil untuk halaman tersebut

```
index.html  ──loadPage()──►  fetch partial HTML
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

### `api.js` — ApiClient
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

### `siswa/utils.js` — Utils
Helper fungsi umum yang dipakai di seluruh modul.

| Fungsi | Kegunaan |
|---|---|
| `formatRupiah(amount)` | Format angka ke `Rp 15.000` |
| `sanitize(str)` | Escape HTML untuk cegah XSS |
| `generateOrderId()` | Generate ID order acak (mode offline) |
| `validateNama(nama)` | Validasi input nama pelanggan |

---

### `siswa/menuTable.js` — MenuTable
Cache in-memory untuk data menu dan kantin dari API.

```js
MenuTable.loadFromApi()             // Fetch & simpan data dari backend
MenuTable.getKantinList()           // Ambil daftar kantin
MenuTable.getMenuByKantin(kantinId) // Ambil menu berdasarkan kantin
MenuTable.findMenuItemById(id)      // Cari satu item menu
MenuTable.getTopMenu()              // Ambil 3 menu teratas
MenuTable.isApiBacked()             // Cek apakah data berasal dari API
```

---

### `siswa/cart.js` — Cart
Manajemen state keranjang belanja (in-memory, reset saat halaman reload).

```js
Cart.addItem(menuItem)    // Tambah item (quantity +1 jika sudah ada)
Cart.removeItem(id)       // Kurangi quantity (hapus jika quantity = 0)
Cart.getItems()           // Ambil semua item di keranjang
Cart.getTotal()           // Hitung total harga
Cart.isEmpty()            // Cek apakah keranjang kosong
Cart.clearCart()          // Kosongkan keranjang
```

---

### `siswa/orderStateMachine.js` — OrderStateMachine
State machine untuk tracking status pesanan aktif.

```
IDLE → ORDERED → COOKING → READY → DONE
```

```js
OrderStateMachine.transition(state)   // Pindah state (harus sesuai alur)
OrderStateMachine.forceState(state)   // Paksa set state (untuk update dari socket.io)
OrderStateMachine.getState()          // Ambil state saat ini
OrderStateMachine.getStepStatus(step) // "done" | "active" | "inactive"
OrderStateMachine.reset()             // Reset ke IDLE
```

---

### `siswa/ui.js` — UI
Komponen UI shared untuk halaman siswa.

```js
UI.renderOrderStatus(orderId, summary, total)  // Tampilkan popup status pesanan
UI.hideOrderStatus()                           // Sembunyikan popup status pesanan
UI.toggleOrderStatus()                         // Toggle show/hide popup (tombol jam 🕐)
UI.updateEstimasiWaktu()                       // Update estimasi waktu dari pesanan COOKING
UI.renderOrderItems()                          // Render daftar item di form booking
UI.renderMenuGrid(kantinId)                    // Render grid menu berdasarkan kantin
```

---

### `siswa/booking.js` — booking
Logic spesifik halaman pemesanan.

```js
booking.renderKantinSelect()        // Populate dropdown pilih kantin
booking.renderMenuGrid(kantinId)    // Render menu + tombol +/- quantity
booking.renderOrderItems()          // Render ringkasan item yang dipilih
```

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
npm run dev   # Watch mode (development)
```

Output di `src/output.css` **jangan diedit manual**, file ini auto-generated.