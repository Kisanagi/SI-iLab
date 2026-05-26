const supabase = require('../lib/supabase');

const REQUIRED_DETAIL_FIELDS = {
  'Enrollment': ['kelas', 'email', 'no_hp', 'nama_praktikum', 'kode_mata_kuliah'],
  'Pendaftaran Pengulangan Praktikum': ['kelas_asli', 'kelas_pengulangan', 'email', 'praktikum_yang_diulang', 'kode_mata_kuliah'],
  'Lainnya': ['keterangan'],
};

async function generateKodeTiket() {
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true });
  const nomor = String((count || 0) + 1).padStart(3, '0');
  return `TKT-${nomor}`;
}

async function buatTiket({ npm, nama_mahasiswa, judul, kategori, ringkasan, pesan_asli, detail, krs_url }) {
  // Validasi field detail wajib per kategori
  const requiredFields = REQUIRED_DETAIL_FIELDS[kategori];
  if (requiredFields) {
    const missingFields = requiredFields.filter(f => !detail?.[f] || String(detail[f]).trim() === '');
    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Data belum lengkap. Field yang masih kosong: ${missingFields.join(', ')}. Minta mahasiswa melengkapi data terlebih dahulu.`,
      };
    }
  }

  // Validasi KRS wajib untuk Pendaftaran Pengulangan Praktikum
  if (kategori === 'Pendaftaran Pengulangan Praktikum' && !krs_url) {
    return {
      success: false,
      error: 'KRS wajib dilampirkan untuk pendaftaran pengulangan praktikum. Minta mahasiswa mengupload file KRS terlebih dahulu.',
    };
  }

  const kode_tiket = await generateKodeTiket();

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      npm,
      nama_mahasiswa,
      judul,
      kategori,
      ringkasan,
      pesan_asli,
      detail,
      status: 'Menunggu',
      kode_tiket,
      ...(krs_url ? { krs_url } : {}),
    })
    .select('id, kode_tiket, created_at')
    .single();

  if (error) throw new Error(`Gagal membuat tiket: ${error.message}`);
  return data;
}

module.exports = { buatTiket };
