export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, salonName, email, plan, currentPlan, newPlan } = req.body;

    if (!type || !salonName || !email) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const PLANS = {
      trial:    { name: 'Essai gratuit', sms: 50,  price: 0  },
      starter:  { name: 'Starter',       sms: 100, price: 29 },
      pro:      { name: 'Pro',           sms: 250, price: 49 },
      business: { name: 'Business',      sms: 650, price: 89 },
    };

    const sender    = process.env.GMAIL_SENDER;
    const titulaire = process.env.RIB_TITULAIRE;
    const iban      = process.env.RIB_IBAN;

    if (!sender) return res.status(500).json({ error: 'GMAIL_SENDER manquant' });
    if (!process.env.BREVO_API_KEY) return res.status(500).json({ error: 'BREVO_API_KEY manquant' });

    const planInfo = PLANS[plan] || PLANS['trial'];
    let subject, htmlContent;

    if (type === 'inscription') {
      const isPaid = plan && plan !== 'trial';
      subject = `Bienvenue sur AvisExpress${isPaid ? ' — Activation de votre compte' : ' — Votre essai gratuit'}`;
      htmlContent = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1814">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="font-size:24px;font-weight:800;margin:0">✂️ AvisExpress</h1>
          </div>
          <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Bienvenue, ${salonName} ! 👋</h2>
          <p style="color:#6b6560;line-height:1.6;margin-bottom:24px">
            Merci de votre confiance ! Votre compte a bien été créé.
            ${isPaid ? 'Il ne reste plus qu\'une étape pour l\'activer : effectuer votre virement.' : 'Vous bénéficiez de <strong>50 SMS gratuits</strong> pour découvrir AvisExpress.'}
          </p>
          <div style="background:#f6f3ee;border:1px solid #e0dbd2;border-radius:16px;padding:24px;margin-bottom:24px">
            <h3 style="font-size:14px;font-weight:700;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.5px;color:#a8a39c">Votre formule</h3>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:18px;font-weight:800">${planInfo.name}</div>
                <div style="color:#6b6560;font-size:14px">${planInfo.sms} SMS${isPaid ? ' / mois' : ' offerts'}</div>
              </div>
              <div style="font-size:24px;font-weight:800;color:#a07820">${isPaid ? planInfo.price + '€' : 'Gratuit'}<span style="font-size:13px;font-weight:400;color:#6b6560">${isPaid ? '/mois' : ''}</span></div>
            </div>
          </div>
          ${isPaid ? `
          <div style="background:#fdf6e3;border:1px solid #e8d5a0;border-radius:16px;padding:24px;margin-bottom:24px">
            <h3 style="font-size:14px;font-weight:700;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.5px;color:#a07820">Virement à effectuer</h3>
            <table style="width:100%;border-collapse:collapse">
              <tr style="border-bottom:1px solid #e8d5a0"><td style="padding:10px 0;color:#6b6560;font-size:13px">Bénéficiaire</td><td style="padding:10px 0;font-weight:600;font-size:14px;text-align:right">${titulaire || ''}</td></tr>
              <tr style="border-bottom:1px solid #e8d5a0"><td style="padding:10px 0;color:#6b6560;font-size:13px">IBAN</td><td style="padding:10px 0;font-weight:600;font-size:14px;text-align:right;font-family:monospace">${iban || ''}</td></tr>
              <tr style="border-bottom:1px solid #e8d5a0"><td style="padding:10px 0;color:#6b6560;font-size:13px">Montant</td><td style="padding:10px 0;font-weight:800;font-size:16px;color:#a07820;text-align:right">${planInfo.price}€</td></tr>
              <tr><td style="padding:10px 0;color:#6b6560;font-size:13px">Référence</td><td style="padding:10px 0;font-weight:600;font-size:14px;text-align:right">AVIS-${salonName.replace(/\s/g,'-').toUpperCase()}</td></tr>
            </table>
          </div>
          <div style="background:#edf7f1;border:1px solid #a8d9bc;border-radius:12px;padding:16px;margin-bottom:24px">
            <p style="margin:0;color:#2d7a4f;font-size:14px;font-weight:500">✅ Votre compte sera activé sous <strong>24h</strong> après réception du virement.</p>
          </div>
          ` : `
          <div style="background:#edf7f1;border:1px solid #a8d9bc;border-radius:12px;padding:16px;margin-bottom:24px">
            <p style="margin:0;color:#2d7a4f;font-size:14px;font-weight:500">✅ Votre compte est actif ! Connectez-vous sur <strong>avisexpress.fr</strong> pour commencer.</p>
          </div>
          `}
          <p style="color:#6b6560;font-size:13px;line-height:1.6">Une question ? Contactez-nous à <strong>${sender}</strong>.</p>
          <div style="border-top:1px solid #e0dbd2;margin-top:32px;padding-top:20px;text-align:center">
            <p style="color:#a8a39c;font-size:12px;margin:0">✂️ AvisExpress — Automatisez vos avis Google</p>
          </div>
        </div>`;
    }

    if (type === 'upgrade') {
      const currentPlanInfo = PLANS[currentPlan] || PLANS['starter'];
      const newPlanInfo     = PLANS[newPlan]     || PLANS['pro'];
      subject = `Demande de changement d'abonnement — ${newPlanInfo.name}`;
      htmlContent = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1814">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="font-size:24px;font-weight:800;margin:0">✂️ AvisExpress</h1>
          </div>
          <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Changement d'abonnement demandé 📦</h2>
          <p style="color:#6b6560;line-height:1.6;margin-bottom:24px">Bonjour ${salonName}, votre demande de passage à la formule <strong>${newPlanInfo.name}</strong> a bien été enregistrée. Merci de votre confiance !</p>
          <div style="background:#f6f3ee;border:1px solid #e0dbd2;border-radius:16px;padding:24px;margin-bottom:24px">
            <h3 style="font-size:14px;font-weight:700;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.5px;color:#a8a39c">Récapitulatif</h3>
            <div style="display:flex;align-items:center;gap:16px">
              <div style="flex:1;background:#fff;border:1px solid #e0dbd2;border-radius:10px;padding:14px;text-align:center">
                <div style="font-size:12px;color:#a8a39c;margin-bottom:4px">Formule actuelle</div>
                <div style="font-weight:800">${currentPlanInfo.name}</div>
                <div style="color:#6b6560;font-size:13px">${currentPlanInfo.sms} SMS</div>
              </div>
              <div style="font-size:20px">→</div>
              <div style="flex:1;background:#fdf6e3;border:1px solid #e8d5a0;border-radius:10px;padding:14px;text-align:center">
                <div style="font-size:12px;color:#a07820;margin-bottom:4px">Nouvelle formule</div>
                <div style="font-weight:800;color:#a07820">${newPlanInfo.name}</div>
                <div style="color:#6b6560;font-size:13px">${newPlanInfo.sms} SMS</div>
              </div>
            </div>
          </div>
          <div style="background:#fdf6e3;border:1px solid #e8d5a0;border-radius:16px;padding:24px;margin-bottom:24px">
            <h3 style="font-size:14px;font-weight:700;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.5px;color:#a07820">Virement à effectuer</h3>
            <table style="width:100%;border-collapse:collapse">
              <tr style="border-bottom:1px solid #e8d5a0"><td style="padding:10px 0;color:#6b6560;font-size:13px">Bénéficiaire</td><td style="padding:10px 0;font-weight:600;font-size:14px;text-align:right">${titulaire || ''}</td></tr>
              <tr style="border-bottom:1px solid #e8d5a0"><td style="padding:10px 0;color:#6b6560;font-size:13px">IBAN</td><td style="padding:10px 0;font-weight:600;font-size:14px;text-align:right;font-family:monospace">${iban || ''}</td></tr>
              <tr style="border-bottom:1px solid #e8d5a0"><td style="padding:10px 0;color:#6b6560;font-size:13px">Montant</td><td style="padding:10px 0;font-weight:800;font-size:16px;color:#a07820;text-align:right">${newPlanInfo.price}€/mois</td></tr>
              <tr><td style="padding:10px 0;color:#6b6560;font-size:13px">Référence</td><td style="padding:10px 0;font-weight:600;font-size:14px;text-align:right">UPGRADE-${salonName.replace(/\s/g,'-').toUpperCase()}</td></tr>
            </table>
          </div>
          <div style="background:#edf7f1;border:1px solid #a8d9bc;border-radius:12px;padding:16px;margin-bottom:24px">
            <p style="margin:0;color:#2d7a4f;font-size:14px;font-weight:500">✅ Votre nouvelle formule sera activée le <strong>1er du mois prochain</strong> après réception du virement.</p>
          </div>
          <p style="color:#6b6560;font-size:13px;line-height:1.6">Une question ? Contactez-nous à <strong>${sender}</strong>.</p>
          <div style="border-top:1px solid #e0dbd2;margin-top:32px;padding-top:20px;text-align:center">
            <p style="color:#a8a39c;font-size:12px;margin:0">✂️ AvisExpress — Automatisez vos avis Google</p>
          </div>
        </div>`;
    }

    if (!htmlContent) {
      return res.status(400).json({ error: 'Type email inconnu' });
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'AvisExpress', email: sender },
        to: [{ email, name: salonName }],
        subject,
        htmlContent,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.message || 'Erreur Brevo', details: data });
    }

    return res.status(200).json({ success: true });

  } catch(err) {
    return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
}
