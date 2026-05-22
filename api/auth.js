export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, password, salonName, plan } = req.body;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };

  // INSCRIPTION
  if (action === 'register') {
    try {
      // Vérif doublon
      const check = await fetch(`${SUPABASE_URL}/rest/v1/salons?email=eq.${encodeURIComponent(email)}&select=id`, { headers });
      const existing = await check.json();
      if (existing.length > 0) return res.status(400).json({ error: 'Cet email est déjà utilisé.' });

      // Création compte
      const insert = await fetch(`${SUPABASE_URL}/rest/v1/salons`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          email,
          password,
          salon_name: salonName,
          plan: plan || 'starter',
          status: 'pending',
          credits_used: 0,
          clicks: 0,
          google_link: '',
          message: 'Merci pour votre visite chez {nom_salon} ! 😊 Votre avis nous aide beaucoup : {lien_avis}',
        }),
      });

      const data = await insert.json();
      if (!insert.ok) return res.status(500).json({ error: data.message || 'Erreur création compte' });

      // Email de bienvenue
      try {
        const baseUrl = `https://${req.headers.host}`;
        await fetch(`${baseUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'inscription', salonName, email, plan: plan || 'starter' }),
        });
      } catch(e) { console.log('Email error:', e.message); }

      return res.status(200).json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: 'Erreur serveur: ' + e.message });
    }
  }

  // CONNEXION
  if (action === 'login') {
    try {
      const result = await fetch(`${SUPABASE_URL}/rest/v1/salons?email=eq.${encodeURIComponent(email)}&select=*`, { headers });
      const salons = await result.json();

      if (!salons.length || salons[0].password !== password) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
      }

      const salon = salons[0];
      return res.status(200).json({
        success: true,
        user: {
          id: salon.id,
          email: salon.email,
          salonName: salon.salon_name,
          plan: salon.plan,
          status: salon.status,
          creditsUsed: salon.credits_used,
          clicks: salon.clicks,
          link: salon.google_link,
          message: salon.message,
        }
      });
    } catch(e) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  return res.status(400).json({ error: 'Action inconnue' });
}
