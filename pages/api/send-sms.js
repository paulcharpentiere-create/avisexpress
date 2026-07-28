export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, salonName, googleLink, message } = req.body;

  if (!phone || !salonName || !googleLink) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  // Utiliser le message personnalisé s'il existe, sinon message par défaut
  const smsContent = message || `Merci pour votre visite chez ${salonName} ! 😊 Votre avis nous aide beaucoup : ${googleLink}`;

  // Nom expéditeur = nom du salon (max 11 car, alphanumérique)
  const sender = salonName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 11) || 'AvisExp';

  try {
    const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender,
        recipient: '+33' + phone.replace(/\s/g, '').replace(/^0/, ''),
        content: smsContent,
        type: 'transactional',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.message || 'Erreur Brevo' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
