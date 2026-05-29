const supabase = require('./supabase');

async function fetchKnowledgeBase() {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('topik, konten')
    .order('topik', { ascending: true });

  if (error || !data || data.length === 0) return '';

  const kbText = data.map((k) => `- ${k.topik}: ${k.konten}`).join('\n');
  return `\n\nKNOWLEDGE BASE:\n${kbText}`;
}

module.exports = { fetchKnowledgeBase };
