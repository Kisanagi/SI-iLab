require('dotenv').config();
const express = require('express');
const cors = require('cors');

const chatRouter = require('./routes/chat');
const ticketsRouter = require('./routes/tickets');
const authRouter = require('./routes/auth');
const historyRouter = require('./routes/history');
const knowledgeBaseRouter = require('./routes/knowledge-base');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'https://si-ilab.vercel.app',
  'https://si-ilab.up.railway.app',
  'http://localhost:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json({ limit: '20mb' }));

// Public: cek status tiket by kode_tiket (untuk polling frontend)
// Didaftarkan SEBELUM ticketsRouter (yang pakai authMiddleware) agar tidak ketimpa auth.
const supabase = require('./lib/supabase');
app.get('/status/:kode_tiket', async (req, res) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('kode_tiket, status, catatan_admin')
    .eq('kode_tiket', req.params.kode_tiket)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Tiket tidak ditemukan' });
  res.json(data);
});

// Public: tandai notifikasi status tiket sudah ditampilkan ke mahasiswa
app.patch('/status/:kode_tiket/ack', async (req, res) => {
  const { error } = await supabase
    .from('tickets')
    .update({ notifikasi_terkirim: true })
    .eq('kode_tiket', req.params.kode_tiket);
  if (error) return res.status(500).json({ error: 'Gagal update' });
  res.json({ ok: true });
});

// Public: list semua tiket milik NPM (untuk cek pembaruan status saat halaman dibuka)
app.get('/tickets/npm/:npm', async (req, res) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('kode_tiket, status, catatan_admin, notifikasi_terkirim')
    .eq('npm', req.params.npm);
  if (error) return res.status(500).json({ error: 'Gagal mengambil data tiket' });
  res.json(data);
});

app.use('/chat', chatRouter);
app.use('/tickets', ticketsRouter);
app.use('/auth', authRouter);
app.use('/history', historyRouter);
app.use('/knowledge-base', knowledgeBaseRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend berjalan di http://localhost:${PORT}`);
});
