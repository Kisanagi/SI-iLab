const { Router } = require('express');
const supabase = require('../lib/supabase');

const router = Router();

// GET /history/:npm — ambil riwayat chat berdasarkan NPM
router.get('/:npm', async (req, res) => {
  const { npm } = req.params;

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('role, content, created_at')
    .eq('npm', npm)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: 'Gagal mengambil riwayat chat' });
  res.json(data);
});

// DELETE /history/:npm — hapus semua riwayat chat dan ringkasan berdasarkan NPM
router.delete('/:npm', async (req, res) => {
  const { npm } = req.params;

  const [{ error: errSessions }, { error: errSummary }] = await Promise.all([
    supabase.from('chat_sessions').delete().eq('npm', npm),
    supabase.from('chat_summaries').delete().eq('npm', npm),
  ]);

  if (errSessions) return res.status(500).json({ error: 'Gagal menghapus riwayat chat' });
  res.json({ message: 'Riwayat chat berhasil dihapus' });
});

module.exports = router;
