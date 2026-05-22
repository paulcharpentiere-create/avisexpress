export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
  const ADMIN_PASS   = process.env.ADMIN_PASSWORD;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };

  // Vérification mot de passe admin
  const adminPassword = req.method === 'GET' ? req.query.adminPassword : req.body?.adminPassword;
  if (!adminPassword || adminPassword !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  // GET - récupérer tous les salons
  if (req.method === 'GET') {
    try {
      const result = await fetch(`${SUPABASE_URL}/rest/v1/salons?select=*&order=created_at.desc`, { headers });
      const salons = await result.json();
      return res.status(200).json({ salons });
    } catch(e) {
      return res.status(500).json({ error: 'Erreur récupération salons' });
    }
  }

  // PATCH - mettre à jour un salon
  if (req.method === 'PATCH') {
    const { id, salonName, googleLink, plan, status, message } = req.body;
    try {
      const update = await fetch(`${SUPABASE_URL}/rest/v1/salons?id=eq.${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          salon_name: salonName,
          google_link: googleLink,
          plan,
          status,
          message,
        }),
      });
      if (!update.ok) {
        const err = await update.text();
        return res.status(500).json({ error: err });
      }
      return res.status(200).json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: 'Erreur mise à jour' });
    }
  }

  // DELETE - supprimer un salon
  if (req.method === 'DELETE') {
    const { id } = req.body;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/salons?id=eq.${id}`, { method: 'DELETE', headers });
      return res.status(200).json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: 'Erreur suppression' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
