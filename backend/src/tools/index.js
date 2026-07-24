const { buatTiket } = require("./buatTiket");
const { cekStatus } = require("./cekStatus");

const toolHandlers = {
  buat_tiket: buatTiket,
  cek_status: cekStatus,
};

const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "buat_tiket",
      description:
        "Buat tiket baru untuk permintaan yang memerlukan tindakan admin, seperti registrasi praktikum, kerusakan alat, masalah akun, booking, atau lainnya.",
      parameters: {
        type: "object",
        properties: {
          npm: { type: "string", description: "Nomor Pokok Mahasiswa" },
          nama_mahasiswa: {
            type: "string",
            description: "Nama lengkap mahasiswa",
          },
          judul: { type: "string", description: "Judul singkat tiket" },
          kategori: {
            type: "string",
            enum: [
              "Registrasi Praktikum",
              "Pendaftaran Pengulangan Praktikum",
              "Komplain Nilai",
              "Kendala Akun",
              "Lainnya",
            ],
            description: "Kategori tiket",
          },
          ringkasan: {
            type: "string",
            description: "Ringkasan singkat masalah",
          },
          pesan_asli: {
            type: "string",
            description: "Pesan asli dari mahasiswa",
          },
          detail: {
            anyOf: [{ type: "object" }, { type: "null" }],
            description:
              "Detail spesifik per kategori. Registrasi Praktikum: {kelas, email, no_hp, nama_praktikum, kode_mata_kuliah}. Pendaftaran Pengulangan Praktikum: {kelas_asli, kelas_pengulangan, email, praktikum_yang_diulang, kode_mata_kuliah}. Komplain Nilai: {kode_mata_kuliah, nama_praktikum, keterangan}. Kendala Akun: {no_wa, keterangan}. Lainnya: {keterangan}.",
          },
          krs_url: {
            anyOf: [{ type: "string" }, { type: "null" }],
            description:
              "Path file KRS di storage jika mahasiswa melampirkan KRS. Isi hanya jika ada file KRS yang diupload, jika tidak ada biarkan null.",
          },
        },
        required: [
          "npm",
          "nama_mahasiswa",
          "judul",
          "kategori",
          "ringkasan",
          "pesan_asli",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cek_status",
      description: "Cek status tiket berdasarkan ID tiket atau NPM mahasiswa.",
      parameters: {
        type: "object",
        properties: {
          tiket_id: {
            type: "string",
            description: "ID tiket yang ingin dicek",
          },
          npm: {
            type: "string",
            description: "NPM mahasiswa untuk melihat semua tiket miliknya",
          },
        },
      },
    },
  },
];

module.exports = { toolHandlers, toolDefinitions };
