const supabase = require('./supabase');

async function simpanPesan(npm, role, content) {
  if (!npm) return;
  await supabase.from('chat_sessions').insert({ npm, role, content });
}

// Ambil N pesan terakhir untuk dikirim ke model sebagai pesan terbaru
async function ambilPesanTerakhir(npm, limit = 4) {
  if (!npm) return [];
  const { data } = await supabase
    .from('chat_sessions')
    .select('role, content')
    .eq('npm', npm)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []).reverse();
}

// Ambil semua pesan yang belum dirangkum (setelah jumlah_pesan terakhir)
async function ambilPesanBelumDirangkum(npm, sudahDirangkum) {
  if (!npm) return [];
  const { data } = await supabase
    .from('chat_sessions')
    .select('role, content')
    .eq('npm', npm)
    .order('created_at', { ascending: true });
  const semua = data || [];
  return semua.slice(sudahDirangkum);
}

// Hitung total pesan mahasiswa ini
async function hitungTotalPesan(npm) {
  if (!npm) return 0;
  const { count } = await supabase
    .from('chat_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('npm', npm);
  return count || 0;
}

// Ambil ringkasan percakapan yang tersimpan
async function ambilRingkasan(npm) {
  if (!npm) return null;
  const { data } = await supabase
    .from('chat_summaries')
    .select('ringkasan, jumlah_pesan')
    .eq('npm', npm)
    .single();
  return data || null;
}

// Simpan atau perbarui ringkasan (upsert by npm)
async function simpanRingkasan(npm, ringkasan, jumlahPesan) {
  if (!npm) return;
  await supabase.from('chat_summaries').upsert(
    { npm, ringkasan, jumlah_pesan: jumlahPesan, updated_at: new Date().toISOString() },
    { onConflict: 'npm' }
  );
}

module.exports = {
  simpanPesan,
  ambilPesanTerakhir,
  ambilPesanBelumDirangkum,
  hitungTotalPesan,
  ambilRingkasan,
  simpanRingkasan,
};
