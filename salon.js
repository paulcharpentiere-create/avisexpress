export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };

  // GET - récupérer historique
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID manquant' });

    const result = await fetch(`${SUPABASE_URL}/rest/v1/sms_history?salon_id=eq.${id}&order=created_at.desc&limit=6`, { headers });
    const history = await result.json();
    return res.status(200).json({ history });
  }

  // POST - incrémenter SMS envoyé
  if (req.method === 'POST') {
    const { action, id, phone } = req.body;

    if (action === 'increment_sms') {
      // Incrémenter credits_used
      await fetch(`${SUPABASE_URL}/rest/v1/salons?id=eq.${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ credits_used: req.body.creditsUsed + 1 }),
      });

      // Ajouter à l'historique
      await fetch(`${SUPABASE_URL}/rest/v1/sms_history`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          salon_id: id,
          phone,
          sent_at: new Date().toISOString(),
        }),
      });

      return res.status(200).json({ success: true });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
