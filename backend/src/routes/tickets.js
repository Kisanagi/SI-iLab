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
  const { status, catatan_admin } = req.body;

  const validStatus = ['Menunggu', 'Diproses', 'Selesai', 'Ditolak'];
  if (!status || !validStatus.includes(status)) {
    return res.status(400).json({ error: `Status tidak valid. Pilih: ${validStatus.join(', ')}` });
  }

  // Reset notifikasi_terkirim setiap kali status berubah, supaya mahasiswa
  // tetap diberi tahu meski tiket sudah pernah pindah status sebelumnya
  // (mis. Menunggu -> Diproses -> Selesai, masing-masing perlu notifikasi sendiri).
  const updatePayload = { status, notifikasi_terkirim: false };
  if (catatan_admin !== undefined) updatePayload.catatan_admin = catatan_admin;

  const { data, error } = await supabase
    .from('tickets')
    .update(updatePayload)
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

  // Ambil krs_url sebelum hapus agar bisa hapus file di storage
  const { data: ticket } = await supabase
    .from('tickets')
    .select('krs_url')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: 'Gagal menghapus tiket' });

  // Hapus file KRS dari storage jika ada
  if (ticket?.krs_url) {
    await supabase.storage.from('KRS-File').remove([ticket.krs_url]);
  }

  res.json({ message: 'Tiket berhasil dihapus' });
});

module.exports = router;
