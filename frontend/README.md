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
│   │   ├── profile.png
│   │   ├── auth-bg.png
│   │   ├── avatars/
│   │   │   └── profile.png
│   │   └── images/             
│   │       ├── nasi_goreng.png
│   │       ├── ayam_goreng.png
│   │       ├── es_teh_manis.png
│   │       └── jus_jeruk.png
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
│   │       └── index.html     
│   │
│   └── js/
│       ├── api.js              
│       │
│       ├── siswa/              
│       │   ├── utils.js        
│       │   ├── menuTable.js    
│       │   ├── cart.js         
│       │   ├── orderStateMachine.js  
│       │   ├── booking.js      
│       │   ├── dashSiswa.js    
│       │   └── ui.js          
│       │
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

### `siswa/utils.js` Utils
Helper fungsi umum yang dipakai di seluruh modul.

| Fungsi | Kegunaan |
|---|---|
| `formatRupiah(amount)` | Format angka ke `Rp 15.000` |
| `sanitize(str)` | Escape HTML untuk cegah XSS |
| `generateOrderId()` | Generate ID order acak (mode offline) |
| `validateNama(nama)` | Validasi input nama pelanggan |

---

### `siswa/menuTable.js` MenuTable
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