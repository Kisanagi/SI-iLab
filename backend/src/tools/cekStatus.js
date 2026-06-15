const supabase = require('../lib/supabase');

async function cekStatus({ tiket_id, npm }) {
  if (!tiket_id && !npm) {
    throw new Error('Salah satu dari tiket_id atau npm harus diisi');
  }

  const fields = 'id, kode_tiket, judul, kategori, status, ringkasan, nama_mahasiswa, catatan_admin, created_at';

  if (tiket_id) {
    // Coba cari by kode_tiket dulu (TKT-001), lalu by UUID
    const { data: byKode } = await supabase
      .from('tickets')
      .select(fields)
      .eq('kode_tiket', tiket_id)
      .single();

    if (byKode) return byKode;

    const { data, error } = await supabase
      .from('tickets')
      .select(fields)
      .eq('id', tiket_id)
      .single();

    if (error) throw new Error(`Tiket tidak ditemukan`);
    return data;
  }

  const { data, error } = await supabase
    .from('tickets')
    .select(fields)
    .eq('npm', npm)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Gagal mengambil tiket`);
  return data;
}

module.exports = { cekStatus };
