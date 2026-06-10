# 🍽️ Smart Canteen Ordering System

Sistem pemesanan makanan digital untuk kantin sekolah/kampus. Dibangun dengan HTML/TailwindCSS/JavaScript (Vanilla), Node.js, dan MySQL.

---

## 📋 Deskripsi

Smart Canteen adalah aplikasi web yang memungkinkan pelanggan memesan makanan dari kantin secara digital tanpa perlu antre. Admin kantin dapat mengelola menu dan memperbarui status pesanan secara real-time.

---

## ✨ Fitur

### 👨‍🎓 Pelanggan
- Login & autentikasi
- Lihat menu makanan beserta harga
- Pesan makanan dengan validasi input
- Pantau status pesanan secara real-time
- Lihat riwayat pesanan

### 👨‍🍳 Admin Kantin
- Semua fitur pelanggan
- Tambah, edit, dan hapus menu
- Update status pesanan: `ORDERED → COOKING → READY → DONE`
- Lihat seluruh pesanan masuk

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML, TailwindCSS, JavaScript (Vanilla) |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Real-time | Socket.io |

---

## 👥 Role

| Role | Akses |
|------|-------|
| `pelanggan` | Lihat menu, pesan, lihat status & riwayat |
| `penjual` | Semua akses pelanggan + kelola menu + update status pesanan |

---

## 👨‍👩‍👧‍👦 Tim Pengembang

**Team Gehendul**

| No | Nama | NIM |
|----|------|-----|
| 1 | Abidah Fatimatuzzahrahh | 103122400004 |
| 2 | Fatikhah Sukma Arti | 103122400019 |
| 3 | Ryvanda | 103122400027 |
| 4 | Najwa Areefa Ghaisani | 103122400028 |

---

## 📑 Pembagian Jobdesk & Teknik Konstruksi

### 🖥️ Page Penjual

| Nama | Halaman | DbC | Teknik 1 | Teknik 2 |
|------|---------|-----|----------|----------|
| Fatikhah Sukma Arti | Dashboard, Edit Menu | ✅ | Table-driven construction | Parameterization / Generics  |
| Ryvanda | Status Pesanan (Kanban) | ✅ | API | Runtime configuration |

### 🧑‍💻 Page Pelanggan

| Nama | Halaman | DbC | Teknik 1 | Teknik 2 |
|------|---------|-----|----------|----------|
| Abidah Fatimatuzzahrahh | Dashboard, Booking | ✅ | Automata | Code reuse / Library |
| Najwa Areefa Ghaisani | Dashboard, Booking | ✅ | Code reuse / Library | Parameterization / Generics |

---

## 🏗️ Struktur Proyek
```
── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── kantinController.js
│   │   │   ├── menuController.js
│   │   │   └── orderController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── kantinRoutes.js
│   │   │   ├── menuRoutes.js
│   │   │   └── orderRoutes.js
│   │   └── utils/
│   │       ├── ApiError.js
│   │       ├── asyncHandler.js
│   │       ├── jwt.js
│   │       └── orderStateMachine.js
│   ├── scripts/
│   │   ├── initDb.js
│   │   └── seedDb.js
│   └── test/
│       └── validators.test.js
│
└── frontend/
├── src/
│   ├── index.html              # Entry point utama (SPA shell)
│   ├── assets/                 # Gambar & static files
│   ├── partials/
│   │   └── sidebar.html
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
│   └── js/
│       ├── api.js
│       ├── siswa/
│       │   ├── utils.js
│       │   ├── menuTable.js
│       │   ├── cart.js
│       │   ├── orderStateMachine.js
│       │   ├── booking.js
│       │   ├── dashSiswa.js
│       │   └── ui.js
│       └── owner/
│           └── edit-menu.js
└── test/
└── syntax.test.js
```

---

## 🚀 Cara Menjalankan

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev    
npm run serve  
```

---

## 🔄 Alur Status Pesanan
`ORDERED → COOKING → READY → DONE`

| Status | Keterangan |
|--------|------------|
| `ORDERED` | Pesanan masuk, menunggu dikonfirmasi penjual |
| `COOKING` | Pesanan sedang dimasak |
| `READY` | Pesanan siap diambil di kantin |
| `DONE` | Pesanan selesai diambil |

---

## 🔌 REST API Endpoints

### Auth
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/auth/register` | Registrasi akun baru |
| POST | `/api/auth/login` | Login & dapatkan token JWT |

### Menu
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/menus` | Ambil semua menu |
| GET | `/api/menus?kantin_id=1` | Filter menu per kantin |
| POST | `/api/menus` | Tambah menu baru (penjual) |
| PUT | `/api/menus/:id` | Edit menu (penjual) |
| DELETE | `/api/menus/:id` | Hapus menu (penjual) |

### Orders
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/orders` | Buat pesanan baru |
| GET | `/api/orders/me` | Riwayat pesanan milik sendiri |
| GET | `/api/orders/:id` | Detail pesanan |
| PATCH | `/api/orders/:id/status` | Update status pesanan (penjual) |
| GET | `/api/orders/kantin/:id` | Semua pesanan per kantin (penjual) |