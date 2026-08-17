const { Router } = require('express');
const supabase = require('../lib/supabase');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

// GET /knowledge-base — ambil semua isi KB (public, dipakai chat)
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .order('topik', { ascending: true });

  if (error) return res.status(500).json({ error: 'Gagal mengambil knowledge base' });
  res.json(data);
});

// POST /knowledge-base — tambah atau update topik (admin only)
router.post('/', authMiddleware, async (req, res) => {
  const { topik, konten } = req.body;

  if (!topik || !konten) {
    return res.status(400).json({ error: 'Topik dan konten wajib diisi' });
  }

  const { data, error } = await supabase
    .from('knowledge_base')
    .upsert({ topik, konten, updated_at: new Date().toISOString() }, { onConflict: 'topik' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Gagal menyimpan knowledge base' });
  res.json(data);
});

// PUT /knowledge-base/:id — edit topik & konten by id (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { topik, konten } = req.body;

  if (!topik || !konten) {
    return res.status(400).json({ error: 'Topik dan konten wajib diisi' });
  }

  const { data, error } = await supabase
    .from('knowledge_base')
    .update({ topik, konten, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Gagal mengupdate knowledge base' });
  res.json(data);
});

// DELETE /knowledge-base/:id — hapus topik by id (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('knowledge_base')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: 'Gagal menghapus knowledge base' });
  res.json({ message: 'Topik berhasil dihapus' });
});

module.exports = router;
