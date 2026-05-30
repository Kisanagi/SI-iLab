const { Router } = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = Router();

// Client TERPISAH khusus untuk autentikasi.
// Tidak memakai client admin bersama, karena signInWithPassword mengubah sesi
// client — kalau pakai client admin, sesi service_role untuk storage ikut rusak.
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: 'Email atau password salah' });
  }

  res.json({ token: data.session.access_token });
});

module.exports = router;
