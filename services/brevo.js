const https = require('https');

function brevoRequest(endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.brevo.com',
      path: endpoint,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      }
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        console.log(`[Brevo] ${endpoint} : Status ${res.statusCode}`);
        if (res.statusCode >= 400) console.log('Body:', responseData);
        resolve({ status: res.statusCode, body: responseData });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendEmailClient(reservation) {
  if (!reservation || !reservation.email) return;
  try {
    await brevoRequest('/v3/smtp/email', {
      sender: { name: 'Le Beaufortois', email: 'leo0703ca@gmail.com' },
      to: [{ email: reservation.email, name: reservation.nom }],
      subject: 'Votre demande de réservation — Le Beaufortois',
      htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0e0c;font-family:Georgia,serif">
  <div style="max-width:600px;margin:0 auto;background:#0f0e0c">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1a1a,#0f0e0c);padding:48px 40px;text-align:center;border-bottom:1px solid rgba(201,168,76,.3)">
      <div style="font-size:11px;letter-spacing:6px;text-transform:uppercase;color:rgba(201,168,76,.6);margin-bottom:12px">Restaurant Traditionnel Français</div>
      <h1 style="margin:0;font-size:42px;font-weight:400;color:#c9a84c;letter-spacing:3px;font-style:italic">Le Beaufortois</h1>
      <div style="width:60px;height:1px;background:#c9a84c;margin:20px auto;opacity:.5"></div>
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(245,240,232,.4)">Beaufort-sur-Gervanne</div>
    </div>

    <!-- Message principal -->
    <div style="padding:48px 40px;text-align:center">
      <div style="font-size:32px;margin-bottom:16px">🍽</div>
      <h2 style="margin:0 0 16px;font-size:24px;font-weight:400;color:#f5f0e8;letter-spacing:1px">Demande de réservation reçue</h2>
      <p style="margin:0;font-size:15px;color:rgba(245,240,232,.6);line-height:1.8">
        Bonjour <strong style="color:#f5f0e8">${reservation.nom}</strong>,<br>
        Nous avons bien reçu votre demande de table<br>et nous vous confirmons votre réservation dans les plus brefs délais.
      </p>
    </div>

    <!-- Récapitulatif -->
    <div style="margin:0 40px 40px;border:1px solid rgba(201,168,76,.25);background:rgba(201,168,76,.04)">
      <div style="padding:20px 32px;border-bottom:1px solid rgba(201,168,76,.15);text-align:center">
        <div style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c">Récapitulatif de votre réservation</div>
      </div>
      <div style="padding:32px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid rgba(245,240,232,.06)">
              <span style="font-size:18px">📅</span>
              <span style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(245,240,232,.4);margin-left:12px">Date</span>
            </td>
            <td style="padding:12px 0;border-bottom:1px solid rgba(245,240,232,.06);text-align:right;color:#f5f0e8;font-size:16px">
              ${new Date(reservation.date).toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid rgba(245,240,232,.06)">
              <span style="font-size:18px">🕐</span>
              <span style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(245,240,232,.4);margin-left:12px">Heure</span>
            </td>
            <td style="padding:12px 0;border-bottom:1px solid rgba(245,240,232,.06);text-align:right;color:#f5f0e8;font-size:16px">
              ${reservation.heure}
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid rgba(245,240,232,.06)">
              <span style="font-size:18px">👥</span>
              <span style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(245,240,232,.4);margin-left:12px">Personnes</span>
            </td>
            <td style="padding:12px 0;border-bottom:1px solid rgba(245,240,232,.06);text-align:right;color:#f5f0e8;font-size:16px">
              ${reservation.personnes} personne${reservation.personnes > 1 ? 's' : ''}
            </td>
          </tr>
          ${reservation.message ? `
          <tr>
            <td style="padding:12px 0" colspan="2">
              <span style="font-size:18px">💬</span>
              <span style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(245,240,232,.4);margin-left:12px">Message</span>
              <div style="margin-top:8px;color:rgba(245,240,232,.6);font-style:italic;font-size:14px;padding-left:30px">${reservation.message}</div>
            </td>
          </tr>` : ''}
        </table>
      </div>
    </div>

    <!-- Note -->
    <div style="margin:0 40px 40px;padding:24px;background:rgba(201,168,76,.06);border-left:3px solid #c9a84c">
      <p style="margin:0;font-size:13px;color:rgba(245,240,232,.5);line-height:1.8;font-style:italic">
        En cas d'empêchement, merci de nous prévenir le plus tôt possible.<br>
        Nous ferons tout pour vous offrir un moment agréable.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:32px 40px;border-top:1px solid rgba(201,168,76,.15);text-align:center">
      <div style="font-size:16px;font-style:italic;color:#c9a84c;margin-bottom:8px">À très bientôt !</div>
      <div style="font-size:11px;color:rgba(245,240,232,.3);letter-spacing:2px;text-transform:uppercase">L'équipe du Beaufortois</div>
      <div style="width:40px;height:1px;background:rgba(201,168,76,.3);margin:20px auto"></div>
      <div style="font-size:11px;color:rgba(245,240,232,.2)">Beaufort-sur-Gervanne — Cuisine française traditionnelle</div>
    </div>

  </div>
</body>
</html>
`
    });
  } catch(e) { console.error('Erreur email client:', e); }
}

async function sendEmailStatut(reservation, statut) {
  if (!reservation || !reservation.email) return;
  const confirme = statut === 'confirme';
  try {
    await brevoRequest('/v3/smtp/email', {
      sender: { name: 'Le Beaufortois', email: 'leo0703ca@gmail.com' },
      to: [{ email: reservation.email, name: reservation.nom }],
      subject: confirme ? 'Réservation confirmée — Le Beaufortois 🎉' : 'Réservation annulée — Le Beaufortois',
      htmlContent: confirme ? `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a1a;color:#f5f0e8;padding:40px">
          <h1 style="color:#c9a84c;text-align:center">Le Beaufortois</h1>
          <h2 style="color:#4caf80;text-align:center">✅ Réservation confirmée !</h2>
          <p>Bonjour <strong>${reservation.nom}</strong>, votre table est confirmée !</p>
          <div style="background:rgba(201,168,76,.1);border:1px solid #c9a84c;padding:20px;margin:20px 0">
            <p>📅 ${reservation.date} à ${reservation.heure}</p>
            <p>👥 ${reservation.personnes} personne(s)</p>
          </div>
          <p>À très bientôt !</p>
        </div>
      ` : `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a1a;color:#f5f0e8;padding:40px">
          <h1 style="color:#c9a84c;text-align:center">Le Beaufortois</h1>
          <p>Bonjour <strong>${reservation.nom}</strong>,</p>
          <p>Votre réservation du ${reservation.date} à ${reservation.heure} a été annulée.</p>
          <p>Contactez-nous pour une nouvelle date.</p>
        </div>
      `
    });
  } catch(e) { console.error('Erreur email statut:', e); }
}

async function sendSmsRestaurant(reservation) {
  if (!reservation) return;
  const phone = process.env.RESTAURANT_PHONE
    ? process.env.RESTAURANT_PHONE.replace(/\D/g, '')
    : null;
  if (!phone) { console.log('SMS: pas de numéro configuré'); return; }
  try {
    await brevoRequest('/v3/transactionalSMS/sms', {
      sender: 'Beaufortois',
      recipient: phone.startsWith('33') ? '+' + phone : '+33' + phone.replace(/^0/, ''),
      content: `Nouvelle resa: ${reservation.nom}, ${reservation.personnes} pers, ${reservation.date} a ${reservation.heure}. Tel: ${reservation.telephone}`
    });
  } catch(e) { console.error('Erreur SMS:', e); }
}

module.exports = { sendEmailClient, sendEmailStatut, sendSmsRestaurant };
