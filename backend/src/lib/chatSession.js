const supabase = require('./supabase');

async function simpanPesan(npm, role, content) {
  if (!npm) return;
  await supabase.from('chat_sessions').insert({ npm, role, content });
}

module.exports = { simpanPesan };
