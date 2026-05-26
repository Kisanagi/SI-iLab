# Lab Chatbot — Sistem Informasi Laboratorium

Chatbot berbasis AI untuk membantu mahasiswa dengan informasi laboratorium, pembuatan tiket, dan pengecekan status permintaan.

## Teknologi

| Layer    | Stack                                    |
|----------|------------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Axios      |
| Backend  | Express.js, Groq SDK, Supabase JS        |
| AI       | Groq (LLaMA3 70B) dengan Function Calling|
| Database | Supabase (PostgreSQL)                    |

---

## Prasyarat

- Node.js v18 atau lebih baru
- Akun [Supabase](https://supabase.com) dengan project aktif
- API key dari [Groq](https://console.groq.com)

---

## Setup Database Supabase

Jalankan SQL berikut di **SQL Editor** Supabase Anda:

```sql
-- Tabel tiket
create table tickets (
  id          uuid primary key default gen_random_uuid(),
  nim         text not null,
  nama_mahasiswa text not null,
  judul       text not null,
  kategori    text not null check (kategori in ('Enrollment','Kerusakan','Akun','Booking','Lainnya')),
  prioritas   text not null check (prioritas in ('Rendah','Sedang','Tinggi')),
  status      text not null default 'Menunggu' check (status in ('Menunggu','Diproses','Selesai')),
  ringkasan   text,
  pesan_asli  text,
  detail      jsonb,
  created_at  timestamptz default now()
);

-- Tabel knowledge base
create table knowledge_base (
  id         uuid primary key default gen_random_uuid(),
  topik      text unique not null,
  konten     text not null,
  updated_at timestamptz default now()
);
```

---

## Instalasi

```bash
# 1. Clone repo
git clone <url-repo>
cd lab-chatbot

# 2. Install dependencies backend
cd backend
npm install

# 3. Install dependencies frontend
cd ../frontend
npm install
```

---

## Konfigurasi Backend

Buat file `.env` di folder `backend/` berdasarkan `.env.example`:

```bash
cd backend
cp .env.example .env
```

Isi nilai berikut di `backend/.env`:

```
GROQ_API_KEY=gsk_...          # dari https://console.groq.com
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...   # Service Role key (bukan anon key)
PORT=3000
```

> **Penting:** Gunakan **Service Role key** Supabase, bukan anon key, agar backend punya akses penuh ke database.

---

## Menjalankan Aplikasi

Buka **dua terminal terpisah**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Backend berjalan di: http://localhost:3000

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Frontend berjalan di: http://localhost:5173

---

## Halaman Aplikasi

| URL                        | Deskripsi                              |
|----------------------------|----------------------------------------|
| `http://localhost:5173/`   | Chat mahasiswa (tidak perlu login)     |
| `http://localhost:5173/admin/login` | Login admin                   |
| `http://localhost:5173/admin/dashboard` | Dashboard tiket (perlu login) |

---

## API Endpoints

| Method | Endpoint          | Auth     | Deskripsi                     |
|--------|-------------------|----------|-------------------------------|
| POST   | `/chat`           | Tidak    | Kirim pesan, terima balasan AI |
| POST   | `/auth/login`     | Tidak    | Login admin, dapat JWT         |
| GET    | `/tickets`        | JWT      | Ambil semua tiket              |
| PATCH  | `/tickets/:id`    | JWT      | Update status tiket            |

---

## Alur Function Calling

```
Mahasiswa kirim pesan
        │
        ▼
  POST /chat → Groq LLaMA3 70B
        │
  ┌─────┴──────┐
  │ Tool call? │
  └─────┬──────┘
   Ya   │   Tidak
   │    │      └─► Balas langsung
   ▼    │
jalankan tool (Supabase)
   │
   ▼
kirim tool result → Groq
   │
   ▼
final reply → mahasiswa
```

**Tiga tools tersedia:**
- `buat_tiket` — membuat tiket baru di database
- `cek_status` — mengecek status tiket by ID atau NIM
- `update_kb` — update knowledge base (admin only)
