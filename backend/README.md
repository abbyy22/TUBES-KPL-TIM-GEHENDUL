# Backend - Smart Canteen Ordering System

Backend untuk Smart Canteen (telFood) yang dibangun dengan **Node.js + Express.js + MySQL** sesuai spesifikasi `README.md` di root repo.

## Fitur

- **Autentikasi JWT** (register / login) dengan dua role: `pelanggan` dan `admin`.
- **CRUD Menu** dan **CRUD Kantin** (admin) + list (semua user terotentikasi).
- **Order**: pelanggan membuat pesanan dengan validasi input dan multi-item; admin update status mengikuti state machine `ORDERED → COOKING → READY → DONE`.
- **Riwayat pesanan** untuk pelanggan, **daftar semua pesanan** untuk admin (filter `status`, `kantin_id`).
- **Foto Profil User**: pelanggan dan admin dapat upload/hapus foto profil melalui endpoint `/api/auth/avatar`.
- **Foto Menu**: admin/penjual dapat upload/hapus foto setiap menu melalui endpoint `/api/menus/:id/photo`; foto langsung tampil ke pelanggan via Socket.io.
- Validasi input + error handler terpusat.
- CORS aktif untuk integrasi dengan frontend.

## Struktur Direktori

```
backend/
├── database/
│   ├── schema.sql              # DDL tabel users, kantins, menus, orders, order_items, uploads
│   ├── seed.sql                # Sample data (kantin, menu, user demo)
│   └── migrate_add_photos.sql  # Migration: tambah photo_url & tabel uploads
├── scripts/
│   ├── initDb.js               # Jalankan schema.sql
│   ├── seedDb.js               # Jalankan seed.sql
│   ├── migratePhotos.js        # Jalankan migrate_add_photos.sql
│   ├── seedPhotos.js           # Jalankan seed default photo_url untuk demo
│   └── seedTodayOrders.js      # Jalankan seed order hari ini untuk simulasi
├── uploads/                    # Folder penyimpanan foto (gitignore'd)
│   ├── avatars/                # Foto profil user
│   └── menus/                  # Foto menu
├── src/
│   ├── app.js                  # Setup Express app, middleware, Socket.io, & router
│   ├── index.js                # Server entry point, inisialisasi server HTTP & Socket.io
│   ├── config/                 # env.js (variabel lingkungan), db.js (koneksi MySQL pool)
│   ├── controllers/            # Controller logic (auth, kantin, menu, order, upload)
│   ├── middleware/             # Middleware (auth JWT/role, errorHandler, security, upload Multer)
│   ├── repositories/           # Akses langsung ke database (userRepository)
│   ├── routes/                 # Routing endpoint API (/api/auth, /api/kantins, /api/menus, /api/orders)
│   ├── services/               # Logic bisnis terisolasi (authService)
│   ├── utils/                  # Helper & utilitas (ApiError, asyncHandler, contract DbC, jwt, FSM)
│   └── validators/             # Skema validasi skema input (auth, menu, order)
├── test/
│   └── validators.test.js      # Pengujian unit untuk validator backend
├── .env.example                # Templat konfigurasi env
├── package.json                # Pengelolaan dependencies & scripts backend
└── README.md                   # Dokumentasi backend ini
```

## Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Salin `.env`**
   ```bash
   cp .env.example .env
   # edit DB_USER / DB_PASSWORD / JWT_SECRET
   ```

3. **Buat schema + seed**
   ```bash
   npm run db:init    # menjalankan database/schema.sql
   npm run db:seed    # menjalankan database/seed.sql
   ```

   > Jika database **sudah ada** sebelumnya (sebelum fitur foto ditambahkan), jalankan migration:
   > ```bash
   > npm run db:migrate:photos
   > ```

4. **Jalankan server**
   ```bash
   npm run dev        # nodemon (auto-reload)
   # atau
   npm start
   ```

Server jalan di `http://localhost:3000` (default).

## User Demo (setelah seed)

| Admin NEO 1| `neo1@telfood.test`       | `password123` |
| Admin NEO 2| `neo2@telfood.test`       | `password123` |
| Admin TPB  | `tpb@telfood.test`        | `password123` |
| Admin GKM  | `gkm@telfood.test`        | `password123` |
| pelanggan  | `pelanggan@telfood.test`  | `password123` |

## Daftar Endpoint

### Auth (`/api/auth`)
| Method | Path             | Auth | Deskripsi                                        |
|--------|------------------|------|--------------------------------------------------|
| POST   | `/register`      | -    | Daftar user (default role `pelanggan`)           |
| POST   | `/login`         | -    | Login, return JWT                                |
| GET    | `/me`            | JWT  | Profil user saat ini (termasuk `photo_url`)      |
| POST   | `/avatar`        | JWT  | Upload/ganti foto profil (`multipart/form-data`, field `photo`) |
| DELETE | `/avatar`        | JWT  | Hapus foto profil (set null)                     |

### Kantins (`/api/kantins`)
| Method | Path     | Auth        | Deskripsi              |
|--------|----------|-------------|------------------------|
| GET    | `/`      | JWT         | List semua kantin      |
| GET    | `/:id`   | JWT         | Detail kantin          |
| POST   | `/`      | JWT + admin | Tambah kantin          |
| PUT    | `/:id`   | JWT + admin | Edit kantin            |
| DELETE | `/:id`   | JWT + admin | Hapus kantin           |

### Menus (`/api/menus`)
| Method | Path           | Auth        | Deskripsi                                             |
|--------|----------------|-------------|-------------------------------------------------------|
| GET    | `/`            | JWT         | List menu (filter `?kantin_id=&available=`, termasuk `photo_url`) |
| GET    | `/:id`         | JWT         | Detail menu (termasuk `photo_url`)                    |
| POST   | `/`            | JWT + admin | Tambah menu                                           |
| PUT    | `/:id`         | JWT + admin | Edit menu                                             |
| DELETE | `/:id`         | JWT + admin | Hapus menu                                            |
| POST   | `/:id/photo`   | JWT + admin | Upload/ganti foto menu (`multipart/form-data`, field `photo`) |
| DELETE | `/:id/photo`   | JWT + admin | Hapus foto menu (set null)                            |

### Orders (`/api/orders`)
| Method | Path              | Auth        | Deskripsi                                         |
|--------|-------------------|-------------|---------------------------------------------------|
| POST   | `/`               | JWT         | Buat pesanan baru (pelanggan)                     |
| GET    | `/me`             | JWT         | Riwayat pesanan user saat ini                     |
| GET    | `/`               | JWT + admin | Semua pesanan (filter `?status=&kantin_id=`)      |
| GET    | `/:id`            | JWT         | Detail pesanan (pelanggan hanya milik sendiri)    |
| PATCH  | `/:id/status`     | JWT + admin | Update status sesuai state machine                |

## Contoh Request

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"pelanggan@telfood.test","password":"password123"}'
```

### Buat pesanan
```bash
curl -X POST http://localhost:3000/api/orders \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "kantin_id": 1,
    "customer_name": "Mimae",
    "items": [
      { "menu_id": 1, "quantity": 2 },
      { "menu_id": 2, "quantity": 1 }
    ]
  }'
```

### Admin update status
```bash
curl -X PATCH http://localhost:3000/api/orders/1/status \
  -H 'Authorization: Bearer <ADMIN_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"status":"COOKING"}'
```

### Upload foto profil (pelanggan / admin)
```bash
curl -X POST http://localhost:3000/api/auth/avatar \
  -H 'Authorization: Bearer <JWT>' \
  -F 'photo=@/path/ke/foto.jpg'
```

Response:
```json
{ "success": true, "data": { "photo_url": "http://localhost:3000/uploads/avatars/1717000000-123456.jpg" } }
```

### Upload foto menu (admin only)
```bash
curl -X POST http://localhost:3000/api/menus/1/photo \
  -H 'Authorization: Bearer <ADMIN_JWT>' \
  -F 'photo=@/path/ke/foto-menu.jpg'
```

Response:
```json
{ "success": true, "data": { "menu_id": 1, "photo_url": "http://localhost:3000/uploads/menus/1717000000-654321.jpg" } }
```

### Hapus foto menu (admin only)
```bash
curl -X DELETE http://localhost:3000/api/menus/1/photo \
  -H 'Authorization: Bearer <ADMIN_JWT>'
```

## State Machine

Transisi status pesanan dibatasi:

```
ORDERED → COOKING → READY → DONE
```

Transisi mundur, melompat, atau yang tidak valid akan ditolak dengan HTTP 400.

## Format Response

Semua response sukses berbentuk:
```json
{ "success": true, "data": ... }
```

Error:
```json
{ "success": false, "error": { "message": "...", "details": null } }
```

---

## Teknik Konstruksi Perangkat Lunak

Berikut adalah enam teknik konstruksi perangkat lunak yang diterapkan dalam backend ini beserta lokasi dan penjelasan masing-masing.

---

### a. Automata

**Lokasi:** `src/utils/orderStateMachine.js`

Backend mengimplementasikan **Finite State Machine (FSM)** untuk mengontrol alur status pesanan. Setiap pesanan hanya bisa berpindah ke state berikutnya sesuai transisi yang telah didefinisikan; transisi mundur atau melompat secara eksplisit ditolak.

```
ORDERED → COOKING → READY → DONE
```

```js
// src/utils/orderStateMachine.js
const TRANSITIONS = Object.freeze({
  ORDERED: ['COOKING'],
  COOKING: ['READY'],
  READY:   ['DONE'],
  DONE:    [],
});

function canTransition(from, to) {
  if (!isValidState(from) || !isValidState(to)) return false;
  return TRANSITIONS[from].includes(to);
}
```

Fungsi `canTransition()` dipakai oleh `orderController.js` sebelum menyimpan perubahan status ke database. Jika transisi tidak valid, server mengembalikan **HTTP 400** tanpa menyentuh data.

---

### b. Table-driven Construction

**Lokasi:** `src/middleware/auth.js` dan `src/utils/orderStateMachine.js`

**Table-driven construction** menggantikan rangkaian `if-else` panjang dengan struktur data (tabel/objek) yang di-*lookup* saat runtime, sehingga logika lebih mudah dibaca dan dikembangkan.

**1. Tabel transisi state pesanan (`TRANSITIONS`)**

```js
// src/utils/orderStateMachine.js
const TRANSITIONS = Object.freeze({
  ORDERED: ['COOKING'],
  COOKING: ['READY'],
  READY:   ['DONE'],
  DONE:    [],
});
```

Untuk menambah state baru cukup tambah satu baris di tabel — tidak perlu menyentuh logika `canTransition()`.

**2. Tabel role admin (`ADMIN_ROLES`)**

```js
// src/middleware/auth.js
const ADMIN_ROLES = new Set(['admin', 'penjual', 'owner']);

function authorize(...roles) {
  return function (req, res, next) {
    const allowed = new Set(roles);
    if (allowed.has('admin')) {
      ADMIN_ROLES.forEach(r => allowed.add(r)); // lookup dari tabel
    }
    if (!allowed.has(req.user.role)) {
      return next(ApiError.forbidden('Akses ditolak untuk role ini'));
    }
    return next();
  };
}
```

Untuk menambah role baru yang setara admin (misalnya `'superuser'`), cukup tambahkan ke `ADMIN_ROLES` tanpa mengubah logika `authorize()`.

---

### c. Parameterization / Generics

**Lokasi:** `src/utils/asyncHandler.js`, `src/middleware/auth.js`, `src/validators/menuValidator.js`

**Parameterization** adalah teknik membuat fungsi/komponen yang dapat digunakan ulang dengan perilaku berbeda melalui parameter, menghindari duplikasi kode.

**1. Higher-order function `asyncHandler`**

```js
// src/utils/asyncHandler.js
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

`asyncHandler` menerima sembarang fungsi async `fn` sebagai parameter dan mem-*wrap*-nya secara generik — satu fungsi dipakai untuk seluruh controller tanpa mengubah kode handler.

**2. Parameterized middleware `authorize(...roles)`**

```js
// src/middleware/auth.js
function authorize(...roles) {          // menerima daftar role sebagai parameter
  return function (req, res, next) { … };
}

// Penggunaan di routes — perilaku berbeda, fungsi sama:
router.post('/', authenticate, authorize('admin'), kantinController.create);
router.get('/',  authenticate,                     kantinController.list);
```

**3. Parameterized schema `validateMenuInput(body, { partial })`**

```js
// src/validators/menuValidator.js
function validateMenuInput(body, { partial = false } = {}) {
  return partial ? validateMenuUpdate(body) : validateMenuCreate(body);
}
```

Parameter `partial` mengontrol apakah validasi bersifat ketat (CREATE) atau longgar (UPDATE), tanpa menduplikasi definisi schema.

---

### d. Runtime Configuration

**Lokasi:** `src/config/env.js`, `src/config/db.js`, `.env` / `.env.example`

Backend memisahkan semua nilai yang bergantung lingkungan ke dalam file konfigurasi terpusat yang dibaca saat server *startup*, bukan dikodekan secara *hardcoded*.

```js
// src/config/env.js
require('dotenv').config();  // membaca .env saat runtime

const config = {
  env:        process.env.NODE_ENV      || 'development',
  port:       parseInt(process.env.PORT, 10) || 3000,
  corsOrigin: process.env.CORS_ORIGIN   || '*',

  db: {
    host:     process.env.DB_HOST       || 'localhost',
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    user:     process.env.DB_USER       || 'root',
    password: process.env.DB_PASSWORD   || '',
    database: process.env.DB_NAME       || 'smart_canteen',
    connectionLimit: 10,
  },

  jwt: {
    secret:    process.env.JWT_SECRET    || 'dev-only-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
};
```

Modul lain (`db.js`, `jwt.js`, `app.js`) tidak mengakses `process.env` secara langsung — semuanya import dari `config`:

```js
// src/config/db.js
const config = require('./env');
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  …
});
```

Efeknya: untuk deploy ke production cukup ganti nilai di `.env`, tidak perlu menyentuh source code sama sekali. Morgan logger bahkan menyesuaikan format berdasarkan `config.env`:

```js
// src/app.js
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
```

---

### e. Code Reuse / Library

**Lokasi:** `package.json`, `src/utils/`, `src/middleware/`, `src/validators/index.js`

**Code reuse** diterapkan pada dua level: penggunaan pustaka eksternal (*third-party library*) dan abstraksi internal yang dipakai lintas modul.

**1. Pustaka eksternal (third-party)**

| Library | Fungsi | Dipakai di |
|---|---|---|
| `express` | HTTP framework & routing | `app.js`, semua routes |
| `mysql2` | MySQL driver dengan Promise API | `config/db.js` |
| `jsonwebtoken` | Sign & verify JWT | `utils/jwt.js` |
| `bcryptjs` | Hash & compare password | `controllers/authController.js` |
| `joi` | Schema validation | `validators/menuValidator.js`, `authValidator.js`, `orderValidator.js` |
| `cors` | CORS middleware siap pakai | `app.js` |
| `multer` | Handler upload multipart/form-data (foto) | `middleware/upload.js` |
| `morgan` | HTTP request logger | `app.js` |
| `socket.io` | Real-time WebSocket server | `app.js` |
| `dotenv` | Loader variabel lingkungan | `config/env.js` |

**2. Abstraksi internal yang digunakan kembali**

- **`ApiError`** (`src/utils/ApiError.js`) — class error terpusat dengan static factory methods (`badRequest`, `unauthorized`, `forbidden`, dll.) yang digunakan oleh seluruh controller, middleware, dan validator tanpa duplikasi kode error.

```js
// Dipakai di middleware/auth.js, errorHandler.js, semua validators, dll.
throw ApiError.badRequest('kantin_id wajib diisi');
return next(ApiError.unauthorized('Authorization header wajib'));
```

- **`asyncHandler`** (`src/utils/asyncHandler.js`) — *wrapper* generik yang dipakai oleh seluruh route handler async agar error otomatis diteruskan ke `next()`:

```js
// Dipakai di semua 4 controller file
router.get('/', asyncHandler(menuController.list));
router.post('/', asyncHandler(menuController.create));
```

- **`validators/index.js`** — central export point yang menyatukan semua validator ke satu titik impor, menghindari import berulang dari path yang berbeda:

```js
// Cukup satu import dari satu tempat
const { validateRegister, validateMenuInput, validateOrderInput } = require('../validators');
```

---

### f. Design by Contract (DbC)

**Lokasi:** `src/utils/contract.js` dan `src/services/authService.js`

Backend ini menerapkan konsep **Design by Contract (DbC)** untuk memastikan kebenaran input (precondition), keluaran (postcondition), dan kondisi objek (invariant) sebelum dan sesudah suatu operasi bisnis dieksekusi.

**1. Penegasan Precondition (Prasyarat)**
Sebelum melakukan operasi register, sistem memeriksa kelayakan objek input:
```js
// src/services/authService.js
precondition(
  hasRequiredKeys(input, ["name", "email", "password"]),
  "Data registrasi tidak lengkap"
);
precondition(isNonEmptyString(input.email), "Email wajib diisi");
```

**2. Penegasan Postcondition (Pasca-syarat)**
Setelah token JWT digenerasikan, sistem memverifikasi keabsahan token yang dihasilkan sebelum dikembalikan ke client:
```js
// src/services/authService.js
postcondition(isNonEmptyString(token), "Token gagal dibuat");
```

**3. Penegasan Invariant (Kondisi Konstan)**
Memastikan kondisi bernilai benar (true) setelah operasi database selesai:
```js
// src/services/authService.js
invariant(created.id > 0, "User gagal dibuat");
```