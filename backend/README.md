# Backend - Smart Canteen Ordering System

Backend untuk Smart Canteen (telFood) yang dibangun dengan **Node.js + Express.js + MySQL** sesuai spesifikasi `README.md` di root repo.

## Fitur

- **Autentikasi JWT** (register / login) dengan dua role: `pelanggan` dan `admin`.
- **CRUD Menu** dan **CRUD Kantin** (admin) + list (semua user terotentikasi).
- **Order**: pelanggan membuat pesanan dengan validasi input dan multi-item; admin update status mengikuti state machine `ORDERED → COOKING → READY → DONE`.
- **Riwayat pesanan** untuk pelanggan, **daftar semua pesanan** untuk admin (filter `status`, `kantin_id`).
- Validasi input + error handler terpusat.
- CORS aktif untuk integrasi dengan frontend.

## Struktur Direktori

```
backend/
├── database/
│   ├── schema.sql      # DDL tabel users, kantins, menus, orders, order_items
│   └── seed.sql        # Sample data (kantin, menu, user demo)
├── scripts/
│   ├── initDb.js       # Jalankan schema.sql
│   └── seedDb.js       # Jalankan seed.sql
├── src/
│   ├── config/         # env.js, db.js (mysql2 pool)
│   ├── controllers/    # auth, kantin, menu, order
│   ├── middleware/     # auth (JWT + role), errorHandler
│   ├── routes/         # /api/auth, /api/kantins, /api/menus, /api/orders
│   ├── utils/          # ApiError, asyncHandler, jwt, orderStateMachine
│   ├── validators/     # input validators
│   ├── app.js          # Express app
│   └── index.js        # Server entry
├── .env.example
├── package.json
└── README.md
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

4. **Jalankan server**
   ```bash
   npm run dev        # nodemon (auto-reload)
   # atau
   npm start
   ```

Server jalan di `http://localhost:3000` (default).

## User Demo (setelah seed)

| Role      | Email                     | Password    |
|-----------|---------------------------|-------------|
| admin     | `admin@telfood.test`      | `password123` |
| pelanggan | `pelanggan@telfood.test`  | `password123` |

## Daftar Endpoint

### Auth (`/api/auth`)
| Method | Path             | Auth | Deskripsi                          |
|--------|------------------|------|------------------------------------|
| POST   | `/register`      | -    | Daftar user (default role `pelanggan`) |
| POST   | `/login`         | -    | Login, return JWT                  |
| GET    | `/me`            | JWT  | Profil user saat ini               |

### Kantins (`/api/kantins`)
| Method | Path     | Auth        | Deskripsi              |
|--------|----------|-------------|------------------------|
| GET    | `/`      | JWT         | List semua kantin      |
| GET    | `/:id`   | JWT         | Detail kantin          |
| POST   | `/`      | JWT + admin | Tambah kantin          |
| PUT    | `/:id`   | JWT + admin | Edit kantin            |
| DELETE | `/:id`   | JWT + admin | Hapus kantin           |

### Menus (`/api/menus`)
| Method | Path     | Auth        | Deskripsi                                 |
|--------|----------|-------------|-------------------------------------------|
| GET    | `/`      | JWT         | List menu (filter `?kantin_id=&available=`) |
| GET    | `/:id`   | JWT         | Detail menu                               |
| POST   | `/`      | JWT + admin | Tambah menu                               |
| PUT    | `/:id`   | JWT + admin | Edit menu                                 |
| DELETE | `/:id`   | JWT + admin | Hapus menu                                |

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
