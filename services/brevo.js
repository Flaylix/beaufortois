const https = require('https');

function getSender() {
  return {
    name: process.env.RESTAURANT_NAME || 'Le Beaufortois',
    email: process.env.BREVO_SENDER_EMAIL || 'leo0703ca@gmail.com'
  };
}

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

function formatDateFr(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/** DA sombre Le Beaufortois — optimisé mobile, fond uniforme anti-inversion Gmail/iOS */
function buildReservationEmail(reservation) {
  const dateLabel = formatDateFr(reservation.date);
  const persLabel = `${reservation.personnes} personne${reservation.personnes > 1 ? 's' : ''}`;
  const messageRow = reservation.message ? `
                      <tr>
                        <td colspan="2" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:14px 0 0;border-top:1px solid rgba(201,168,76,.15);">
                          <span style="font-size:16px;line-height:1;">💬</span>
                          <span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,168,76,.7);margin-left:8px;">Message</span>
                          <p style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.6;color:rgba(245,240,232,.65);font-style:italic;">${reservation.message}</p>
                        </td>
                      </tr>` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; }
    table { border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; }
    img { border:0; outline:none; }
    @media only screen and (max-width:480px) {
      .wrap-pad { padding:20px 16px !important; }
      .hero-pad { padding:36px 20px !important; }
      .box-pad { padding:20px 16px !important; }
      .title-main { font-size:30px !important; }
      .title-sub { font-size:20px !important; }
      .recap-val { font-size:14px !important; text-align:right !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0f0e0c;" bgcolor="#0f0e0c">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f0e0c" style="background-color:#0f0e0c;">
    <tr>
      <td align="center" class="wrap-pad" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f0e0c" style="max-width:600px;width:100%;background-color:#0f0e0c;">

          <!-- En-tête -->
          <tr>
            <td class="hero-pad" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:40px 24px 32px;text-align:center;border-bottom:1px solid rgba(201,168,76,.25);">
              <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:rgba(201,168,76,.75);">Restaurant Traditionnel Français</p>
              <h1 class="title-main" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:400;font-style:italic;color:#c9a84c;letter-spacing:2px;line-height:1.2;">Le Beaufortois</h1>
              <table role="presentation" width="60" align="center" cellpadding="0" cellspacing="0" style="margin:18px auto;"><tr><td height="1" bgcolor="#c9a84c" style="background-color:#c9a84c;font-size:0;line-height:0;">&nbsp;</td></tr></table>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(245,240,232,.4);">3 Chem. du Village, 38270 Beaufort</p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td class="wrap-pad" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:36px 24px 28px;text-align:center;">
              <p style="margin:0 0 16px;font-size:28px;line-height:1;">🍽</p>
              <h2 class="title-sub" style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#f5f0e8;letter-spacing:.5px;">Demande de réservation reçue</h2>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.8;color:rgba(245,240,232,.65);">
                Bonjour <strong style="color:#f5f0e8;font-weight:700;">${reservation.nom}</strong>,<br>
                Nous avons bien reçu votre demande de table<br>
                et nous vous confirmons votre réservation dans les plus brefs délais.
              </p>
            </td>
          </tr>

          <!-- Récapitulatif -->
          <tr>
            <td class="wrap-pad" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:0 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f0e0c" style="background-color:#0f0e0c;border:1px solid rgba(201,168,76,.3);">
                <tr>
                  <td bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:16px 20px;border-bottom:1px solid rgba(201,168,76,.15);text-align:center;">
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;">Récapitulatif de votre réservation</p>
                  </td>
                </tr>
                <tr>
                  <td class="box-pad" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:20px 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f0e0c" style="background-color:#0f0e0c;">
                      <tr>
                        <td width="50%" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:12px 0;border-bottom:1px solid rgba(245,240,232,.06);vertical-align:middle;">
                          <span style="font-size:16px;">📅</span>
                          <span style="font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,168,76,.65);margin-left:8px;">Date</span>
                        </td>
                        <td class="recap-val" align="right" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:12px 0;border-bottom:1px solid rgba(245,240,232,.06);font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#f5f0e8;vertical-align:middle;">${dateLabel}</td>
                      </tr>
                      <tr>
                        <td bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:12px 0;border-bottom:1px solid rgba(245,240,232,.06);vertical-align:middle;">
                          <span style="font-size:16px;">🕐</span>
                          <span style="font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,168,76,.65);margin-left:8px;">Heure</span>
                        </td>
                        <td class="recap-val" align="right" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:12px 0;border-bottom:1px solid rgba(245,240,232,.06);font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#f5f0e8;vertical-align:middle;">${reservation.heure}</td>
                      </tr>
                      <tr>
                        <td bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:12px 0;vertical-align:middle;">
                          <span style="font-size:16px;">👥</span>
                          <span style="font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,168,76,.65);margin-left:8px;">Personnes</span>
                        </td>
                        <td class="recap-val" align="right" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:12px 0;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#f5f0e8;vertical-align:middle;">${persLabel}</td>
                      </tr>
                      ${messageRow}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Note -->
          <tr>
            <td class="wrap-pad" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:0 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f0e0c" style="background-color:rgba(201,168,76,.06);border-left:3px solid #c9a84c;">
                <tr>
                  <td class="box-pad" bgcolor="#0f0e0c" style="background-color:#141410;padding:20px;">
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.8;color:rgba(245,240,232,.55);font-style:italic;">
                      En cas d'empêchement, merci de nous prévenir le plus tôt possible.<br>
                      Nous ferons tout pour vous offrir un moment agréable.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td class="wrap-pad" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:8px 24px 36px;text-align:center;border-top:1px solid rgba(201,168,76,.12);">
              <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-style:italic;color:#c9a84c;">À très bientôt !</p>
              <p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(245,240,232,.35);">L'équipe du Beaufortois</p>
              <table role="presentation" width="40" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 18px;"><tr><td height="1" bgcolor="rgba(201,168,76,.3)" style="background-color:#c9a84c;opacity:.3;font-size:0;line-height:0;">&nbsp;</td></tr></table>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:10px;color:rgba(245,240,232,.25);">3 Chem. du Village, 38270 Beaufort</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildStatutEmail(reservation, confirme) {
  const dateLabel = formatDateFr(reservation.date);
  const persLabel = `${reservation.personnes} personne${reservation.personnes > 1 ? 's' : ''}`;
  const title = confirme ? 'Réservation confirmée' : 'Réservation annulée';
  const titleColor = confirme ? '#6ecf9a' : '#e08080';
  const intro = confirme
    ? `Bonjour <strong style="color:#f5f0e8;">${reservation.nom}</strong>, votre table est confirmée. Nous vous attendons avec plaisir.`
    : `Bonjour <strong style="color:#f5f0e8;">${reservation.nom}</strong>, votre réservation a été annulée. Contactez-nous pour choisir une autre date.`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <style>
    body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; }
    @media only screen and (max-width:480px) {
      .wrap-pad { padding:20px 16px !important; }
      .title-main { font-size:30px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0f0e0c;" bgcolor="#0f0e0c">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f0e0c" style="background-color:#0f0e0c;">
    <tr>
      <td align="center" class="wrap-pad" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f0e0c" style="max-width:600px;width:100%;background-color:#0f0e0c;">
          <tr>
            <td bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:40px 24px;text-align:center;border-bottom:1px solid rgba(201,168,76,.25);">
              <h1 class="title-main" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:400;font-style:italic;color:#c9a84c;">Le Beaufortois</h1>
            </td>
          </tr>
          <tr>
            <td class="wrap-pad" bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:36px 24px;text-align:center;">
              <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${titleColor};">${title}</p>
              <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.8;color:rgba(245,240,232,.65);">${intro}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f0e0c" style="background-color:#0f0e0c;border:1px solid rgba(201,168,76,.3);">
                <tr>
                  <td bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:20px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:#f5f0e8;text-align:center;">
                    ${dateLabel}<br>${reservation.heure} — ${persLabel}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td bgcolor="#0f0e0c" style="background-color:#0f0e0c;padding:0 24px 36px;text-align:center;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-style:italic;color:#c9a84c;">À très bientôt !</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmailClient(reservation) {
  if (!reservation || !reservation.email) return;
  try {
    await brevoRequest('/v3/smtp/email', {
      sender: getSender(),
      to: [{ email: reservation.email, name: reservation.nom }],
      subject: 'Votre demande de réservation — Le Beaufortois',
      htmlContent: buildReservationEmail(reservation),
    });
  } catch(e) { console.error('Erreur email client:', e); }
}

async function sendEmailStatut(reservation, statut) {
  if (!reservation || !reservation.email) return;
  const confirme = statut === 'confirme';
  try {
    await brevoRequest('/v3/smtp/email', {
      sender: getSender(),
      to: [{ email: reservation.email, name: reservation.nom }],
      subject: confirme ? 'Réservation confirmée — Le Beaufortois' : 'Réservation annulée — Le Beaufortois',
      htmlContent: buildStatutEmail(reservation, confirme),
    });
  } catch(e) { console.error('Erreur email statut:', e); }
}

function toE164(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('33') && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+33${digits.slice(1)}`;
  if (digits.length === 9) return `+33${digits}`;
  return `+${digits}`;
}

async function sendTransactionalSms(recipient, content, label) {
  if (!recipient) {
    console.log(`SMS ${label}: numero invalide`);
    return false;
  }
  try {
    console.log(`SMS ${label} → ${recipient}`);
    const result = await brevoRequest('/v3/transactionalSMS/sms', {
      sender: 'Beaufortois',
      recipient,
      content,
    });
    if (result.status >= 400) {
      console.error(`SMS ${label} refusé (${result.status}):`, result.body);
      if (result.status === 402) {
        console.error('SMS Brevo : credits insuffisants — achetez des credits SMS sur https://app.brevo.com');
      }
      return false;
    }
    console.log(`SMS ${label} envoye (${result.status})`);
    return true;
  } catch (e) {
    console.error(`Erreur SMS ${label}:`, e);
    return false;
  }
}

async function sendSmsClient(reservation) {
  if (!reservation?.telephone) return false;
  const recipient = toE164(reservation.telephone);
  const dateLabel = formatDateFr(reservation.date);
  const content =
    `Le Beaufortois : reservation recue le ${dateLabel} a ${reservation.heure}, ${reservation.personnes} pers. Confirmation sous peu.`;
  return sendTransactionalSms(recipient, content, 'client');
}

async function sendSmsClientStatut(reservation, statut) {
  if (!reservation?.telephone) return false;
  const recipient = toE164(reservation.telephone);
  const confirme = statut === 'confirme';
  const content = confirme
    ? `Le Beaufortois : table confirmee le ${reservation.date} a ${reservation.heure}, ${reservation.personnes} pers. A bientot !`
    : `Le Beaufortois : reservation annulee (${reservation.date} ${reservation.heure}).`;
  return sendTransactionalSms(recipient, content, 'client-statut');
}

async function sendSmsRestaurant(reservation, restaurantPhone) {
  if (!reservation) return false;
  const phone = restaurantPhone || process.env.RESTAURANT_PHONE || '';
  if (!phone) {
    console.log('SMS restaurant: pas de numéro configuré (RESTAURANT_PHONE)');
    return false;
  }
  const recipient = toE164(phone);
  const content =
    `Nouvelle resa ${reservation.nom}, ${reservation.personnes} pers, ${reservation.date} ${reservation.heure}. Tel ${reservation.telephone}`;
  return sendTransactionalSms(recipient, content, 'restaurant');
}

module.exports = {
  sendEmailClient,
  sendEmailStatut,
  sendSmsClient,
  sendSmsClientStatut,
  sendSmsRestaurant,
};
