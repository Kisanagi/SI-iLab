const { createClient } = require('@supabase/supabase-js');

// DIAGNOSTIK SEMENTARA: cek apakah env var ke-load (tanpa membocorkan isinya)
const key = process.env.SUPABASE_SERVICE_KEY;
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'OK' : 'MISSING');
console.log('SUPABASE_SERVICE_KEY:', key ? `OK (panjang ${key.length})` : 'MISSING');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = supabase;
