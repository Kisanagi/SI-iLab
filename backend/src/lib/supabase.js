const { createClient } = require('@supabase/supabase-js');

// Client admin (service_role) untuk operasi database & storage.
// persistSession & autoRefreshToken dimatikan agar sesi tidak pernah
// berubah/tercemar oleh operasi auth — service_role harus selalu tetap.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = supabase;
