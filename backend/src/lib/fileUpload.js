const supabase = require('./supabase');
const { groq: groqVision } = require('./groq');
const pdfParse = require('pdf-parse');

const MODEL_VISION = process.env.MODEL_VISION;

async function uploadKrsToStorage(base64, npm) {
  const buffer = Buffer.from(base64, 'base64');
  const fileName = `${npm}_${Date.now()}.pdf`;

  // Cleanup: hapus file KRS lama milik NPM ini yang tidak terhubung ke tiket
  try {
    const { data: existingFiles } = await supabase.storage
      .from('KRS-File')
      .list('', { search: `${npm}_` });

    if (existingFiles && existingFiles.length > 0) {
      const filePaths = existingFiles.map((f) => f.name);
      const { data: usedFiles } = await supabase
        .from('tickets')
        .select('krs_url')
        .in('krs_url', filePaths);

      const usedPaths = (usedFiles || []).map((t) => t.krs_url);
      const orphans = filePaths.filter((f) => !usedPaths.includes(f));

      if (orphans.length > 0) {
        await supabase.storage.from('KRS-File').remove(orphans);
      }
    }
  } catch (err) {
    console.error('Cleanup KRS gagal (diabaikan):', err.message);
  }

  const { error } = await supabase.storage
    .from('KRS-File')
    .upload(fileName, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    });
  if (error) throw new Error(`Gagal upload KRS: ${error.message}`);
  return fileName;
}

async function processFile(file) {
  if (!file) return null;

  if (file.type === 'pdf') {
    const buffer = Buffer.from(file.base64, 'base64');
    const pdfData = await pdfParse(buffer);
    return { text: pdfData.text, buffer };
  }

  if (file.type === 'image') {
    const visionResponse = await groqVision.chat.completions.create({
      model: MODEL_VISION,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Deskripsikan isi gambar ini secara detail dalam Bahasa Indonesia. Jika ada teks, tuliskan semua teksnya.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${file.mimeType};base64,${file.base64}`,
              },
            },
          ],
        },
      ],
    });
    const description = visionResponse.choices[0].message.content;
    return `\n\n[Mahasiswa melampirkan gambar dengan deskripsi berikut:]\n${description}`;
  }

  return null;
}

module.exports = { uploadKrsToStorage, processFile };
