const { groqReasoning } = require('./groq');

const MODEL_REASONING = process.env.MODEL_REASONING;

// Buat atau perbarui ringkasan percakapan.
// ringkasanLama = ringkasan sebelumnya (string) atau null kalau belum ada
// pesanBaru     = array { role, content } pesan-pesan yang belum dirangkum
async function buatRingkasan(ringkasanLama, pesanBaru) {
  const konteksLama = ringkasanLama
    ? `Ringkasan percakapan sebelumnya:\n${ringkasanLama}\n\n`
    : '';

  const formatPesan = pesanBaru
    .map((m) => `${m.role === 'user' ? 'Mahasiswa' : 'Asisten'}: ${m.content}`)
    .join('\n');

  const prompt = `${konteksLama}Percakapan terbaru:\n${formatPesan}\n\nBuat ringkasan singkat (maksimal 5 kalimat) dalam Bahasa Indonesia yang mencakup: siapa mahasiswanya (nama & NPM jika disebutkan), masalah atau pertanyaan yang dibahas, dan tindakan yang sudah dilakukan (misal: tiket dibuat, data sudah diisi, dll). Tulis hanya ringkasannya saja, tanpa label atau kalimat pembuka.`;

  const response = await groqReasoning.chat.completions.create({
    model: MODEL_REASONING,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  return response.choices[0].message.content.trim();
}

module.exports = { buatRingkasan };
