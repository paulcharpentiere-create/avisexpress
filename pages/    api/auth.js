export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };

  if (req.method === 'POST') {
    const { action, id, phone, creditsUsed } = req.body;

    if (action === 'increment_sms') {
      try {
        // Récupérer credits actuels
        const current = await fetch(`${SUPABASE_URL}/rest/v1/salons?id=eq.${id}&select=credits_used`, { headers });
        const data = await current.json();
        const currentCredits = data[0]?.credits_used || 0;

        // Incrémenter
        await fetch(`${SUPABASE_URL}/rest/v1/salons?id=eq.${id}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ credits_used: currentCredits + 1 }),
        });

        // Historique
        await fetch(`${SUPABASE_URL}/rest/v1/sms_history`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ salon_id: id, phone }),
        });

        return res.status(200).json({ success: true });
      } catch(e) {
        return res.status(500).json({ error: e.message });
      }
    }

    if (action === 'upgrade_request') {
      // Envoyer email de demande d'upgrade
      try {
        const baseUrl = `https://${req.headers.host}`;
        await fetch(`${baseUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'upgrade',
            salonName: req.body.salonName,
            email: req.body.email,
            plan: req.body.newPlan,
            currentPlan: req.body.currentPlan,
            newPlan: req.body.newPlan,
          }),
        });
        return res.status(200).json({ success: true });
      } catch(e) {
        return res.status(500).json({ error: e.message });
      }
    }
  }

  // GET historique
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID manquant' });
    try {
      const result = await fetch(`${SUPABASE_URL}/rest/v1/sms_history?salon_id=eq.${id}&order=sent_at.desc&limit=6`, { headers });
      const history = await result.json();
      return res.status(200).json({ history });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
