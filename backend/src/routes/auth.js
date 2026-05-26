const { Router } = require('express');
const supabase = require('../lib/supabase');

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: 'Email atau password salah' });
  }

  res.json({ token: data.session.access_token });
});

module.exports = router;
