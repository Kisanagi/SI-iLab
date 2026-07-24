# iLab — Sistem Informasi Laboratorium Universitas Gunadarma

iLab adalah aplikasi chatbot berbasis kecerdasan buatan yang dirancang untuk membantu mahasiswa Universitas Gunadarma dalam mengakses informasi dan layanan laboratorium. Mahasiswa dapat berinteraksi melalui antarmuka chat untuk mendapatkan jawaban seputar iLab, membuat tiket pengaduan, serta mengecek status tiket yang telah diajukan.

## Fitur Utama

**Untuk Mahasiswa:**
- Chat dengan AI asisten iLab menggunakan bahasa natural
- Membuat tiket untuk berbagai kategori: Registrasi Praktikum, Pendaftaran Pengulangan Praktikum, Komplain Nilai, Kendala Akun, dan Lainnya
- Melampirkan file KRS (PDF) untuk keperluan pendaftaran pengulangan praktikum
- Mengecek status dan riwayat tiket berdasarkan NPM
- Mendapatkan informasi seputar iLab dari knowledge base yang dikelola admin

**Untuk Admin:**
- Dashboard manajemen tiket dengan fitur pencarian dan filter status
- Mengubah status tiket dan menambahkan catatan untuk mahasiswa
- Melihat file KRS yang dilampirkan mahasiswa
- Mengelola knowledge base (tambah, edit, hapus topik)

## Teknologi

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite, Tailwind CSS, Axios, React Router |
| Backend | Node.js, Express.js, Groq SDK, Supabase JS |
| AI | Groq API dengan Function Calling (dua model: reasoning & vision) |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (file KRS) |
| Auth | Supabase Auth + JWT |

## Arsitektur

Aplikasi menggunakan dua model AI secara bersamaan:
- **Model Reasoning** — menangani seluruh percakapan, pengambilan keputusan, dan pemanggilan tool
- **Model Vision** — khusus mendeskripsikan gambar yang dilampirkan mahasiswa

Knowledge base diinjeksi ke system prompt setiap request (CAG — Context-Augmented Generation), sehingga AI selalu memiliki informasi terkini dari admin tanpa perlu training ulang.

Ketika mahasiswa meminta tindakan seperti membuat tiket atau mengecek status, AI memanggil tool yang terhubung langsung ke Supabase melalui mekanisme Function Calling.
