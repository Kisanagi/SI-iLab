const { Router } = require('express');
const supabase = require('../lib/supabase');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Gagal mengambil data tiket' });
  res.json(data);
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatus = ['Menunggu', 'Diproses', 'Selesai'];
  if (!status || !validStatus.includes(status)) {
    return res.status(400).json({ error: `Status tidak valid. Pilih: ${validStatus.join(', ')}` });
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Gagal memperbarui status tiket' });
  res.json(data);
});

router.get('/:id/krs', async (req, res) => {
  const { id } = req.params;

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('krs_url')
    .eq('id', id)
    .single();

  if (error || !ticket?.krs_url) {
    return res.status(404).json({ error: 'File KRS tidak ditemukan' });
  }

  const { data: signedData, error: signError } = await supabase.storage
    .from('KRS-File')
    .createSignedUrl(ticket.krs_url, 300); // berlaku 5 menit

  if (signError) return res.status(500).json({ error: 'Gagal membuat link KRS' });
  res.json({ url: signedData.signedUrl });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: 'Gagal menghapus tiket' });
  res.json({ message: 'Tiket berhasil dihapus' });
});

module.exports = router;
