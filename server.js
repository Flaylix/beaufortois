require('dotenv').config();

/**
 * Serveur Express — Le Beaufortois
 * API réservations, menu du jour, carte, paramètres et dashboard admin.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const {
  sendEmailClient,
  sendEmailStatut,
  sendSmsRestaurant,
} = require('./services/brevo');

const app = express();
const PORT = process.env.PORT || 3000;

// Client Supabase côté serveur avec la clé service_role.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middlewares globaux.
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('.'));

/**
 * Vérifie le JWT admin dans le header Authorization.
 */
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non autorisé' });

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

/**
 * Convertit "7 personnes ou plus" en entier.
 */
function parsePersonnes(value) {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : 1;
}

/**
 * Retourne la première ligne de paramètres, avec des valeurs par défaut.
 */
async function getParametres() {
  const { data, error } = await supabase
    .from('parametres')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return {
    id: data?.id || null,
    capacite_max: data?.capacite_max ?? 40,
    telephone_restaurant:
      data?.telephone_restaurant || process.env.RESTAURANT_PHONE || '',
    email_restaurant: data?.email_restaurant || process.env.RESTAURANT_EMAIL || 'amandine.vanlande@orange.fr',
  };
}

/**
 * Calcule les couverts déjà réservés pour un créneau donné.
 */
async function getCouvertsCreneau(date, heure) {
  const { data, error } = await supabase
    .from('reservations')
    .select('personnes')
    .eq('date', date)
    .eq('heure', heure)
    .neq('statut', 'annule');

  if (error) throw error;
  return (data || []).reduce((sum, r) => sum + Number(r.personnes || 0), 0);
}

/**
 * Regroupe une liste de plats par catégorie.
 */
function groupCarte(plats) {
  return (plats || []).reduce((acc, plat) => {
    if (!acc[plat.categorie]) acc[plat.categorie] = [];
    acc[plat.categorie].push(plat);
    return acc;
  }, {});
}

// ── Page publique ─────────────────────────────────────────────

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Routes publiques ──────────────────────────────────────────

/**
 * Crée une demande de réservation.
 */
app.post('/api/reservation', async (req, res) => {
  console.log('ENV CHECK:', {
    url: process.env.SUPABASE_URL,
    keyLength: process.env.SUPABASE_SERVICE_KEY?.length,
    hasUrl: !!process.env.SUPABASE_URL,
    hasKey: !!process.env.SUPABASE_SERVICE_KEY,
  });

  try {
    const { nom, telephone, email, date, heure, personnes, message } = req.body;

    if (!nom || !telephone || !date || !heure) {
      return res.status(400).json({
        success: false,
        message: 'Nom, téléphone, date et heure sont obligatoires',
      });
    }

    const nbPersonnes = parsePersonnes(personnes);
    const params = await getParametres();
    const couvertsCreneau = await getCouvertsCreneau(date, heure);

    if (couvertsCreneau + nbPersonnes > params.capacite_max) {
      return res.json({
        success: false,
        message: 'Ce créneau est complet',
      });
    }

    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
    console.log('TABLE:', 'reservations');

    const { data, error } = await supabase
      .from('reservations')
      .insert([{
        nom, telephone, email, date, heure,
        personnes: parseInt(personnes),
        message, statut: 'en_attente'
      }])
      .select()
      .single();

    if (error) {
      console.log('Erreur Supabase détaillée:', error);
      throw error;
    }

    // Maintenant data contient la réservation insérée
    await sendEmailClient(data);
    await sendSmsRestaurant(data, params.telephone_restaurant);

    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/reservation :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Retourne le menu du jour actif.
 */
app.get('/api/menu-jour', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('menu_jour')
      .select('*')
      .eq('actif', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    res.json({ success: true, menu: data || null });
  } catch (err) {
    console.error('GET /api/menu-jour :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Retourne les menus actifs des 7 jours de la semaine.
 */
app.get('/api/menu-semaine', async (req, res) => {
  try {
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const { data, error } = await supabase
      .from('menu_semaine')
      .select('*')
      .eq('actif', true);

    if (error) throw error;

    const menus = jours.map((jour) => {
      const menu = (data || []).find((item) => item.jour === jour);
      return menu || { jour, entree: '', plat: '', dessert: '', prix: '', actif: false };
    });

    res.json({ success: true, menus });
  } catch (err) {
    console.error('GET /api/menu-semaine :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Retourne la dernière photo du menu de la semaine.
 */
app.get('/api/menu-photo', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('menu_photo')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    res.json(data || {});
  } catch (err) {
    console.error('GET /api/menu-photo :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Connexion admin par code PIN.
 */
app.post('/api/admin/login', (req, res) => {
  try {
    const { code } = req.body;

    if (String(code) !== String(process.env.ADMIN_CODE)) {
      return res.json({ success: false });
    }

    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({ success: true, token });
  } catch (err) {
    console.error('POST /api/admin/login :', err);
    res.status(500).json({ success: false });
  }
});

// ── Routes protégées ──────────────────────────────────────────

/**
 * Liste les réservations d'une date.
 */
app.get('/api/reservations', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date requise' });
    }

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('date', date)
      .order('heure', { ascending: true });

    if (error) throw error;
    res.json({ success: true, reservations: data || [] });
  } catch (err) {
    console.error('GET /api/reservations :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Confirme ou annule une réservation.
 */
app.patch('/api/reservation/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['confirme', 'annule'].includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    const { data: reservation, error } = await supabase
      .from('reservations')
      .update({ statut })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await sendEmailStatut(reservation, statut);
    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/reservation/:id :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Statistiques du jour pour le dashboard.
 */
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const params = await getParametres();

    const { data, error } = await supabase
      .from('reservations')
      .select('personnes, statut')
      .eq('date', today);

    if (error) throw error;

    const reservationsJour = data || [];
    const couvertsConfirmes = reservationsJour
      .filter((r) => r.statut === 'confirme')
      .reduce((sum, r) => sum + Number(r.personnes || 0), 0);

    res.json({
      success: true,
      stats: {
        nb_reservations_jour: reservationsJour.length,
        couverts_confirmes: couvertsConfirmes,
        places_restantes: params.capacite_max - couvertsConfirmes,
      },
    });
  } catch (err) {
    console.error('GET /api/stats :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Publie ou remplace le menu du jour.
 */
app.post('/api/menu-jour', authMiddleware, async (req, res) => {
  try {
    const { titre, entree, plat, dessert, prix } = req.body;

    // Un seul menu actif : on désactive les anciens puis on insère le nouveau.
    await supabase.from('menu_jour').update({ actif: false }).eq('actif', true);

    const { error } = await supabase.from('menu_jour').insert({
      titre,
      entree,
      plat,
      dessert,
      prix,
      actif: true,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/menu-jour :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Publie ou remplace le menu d'un jour précis de la semaine.
 */
app.post('/api/menu-semaine', authMiddleware, async (req, res) => {
  try {
    const { jour, entree, plat, dessert, prix } = req.body;
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

    if (!jours.includes(jour)) {
      return res.status(400).json({ success: false, message: 'Jour invalide' });
    }

    const payload = {
      jour,
      entree: entree || '',
      plat: plat || '',
      dessert: dessert || '',
      prix: prix || '',
      actif: Boolean(entree || plat || dessert || prix),
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: fetchError } = await supabase
      .from('menu_semaine')
      .select('id')
      .eq('jour', jour)
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const { error } = existing?.id
      ? await supabase.from('menu_semaine').update(payload).eq('id', existing.id)
      : await supabase.from('menu_semaine').insert(payload);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/menu-semaine :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Upload une photo base64 du menu de la semaine.
 */
app.post('/api/menu-photo', authMiddleware, async (req, res) => {
  try {
    const { photo, date_debut, date_fin } = req.body;

    if (!photo) {
      return res.status(400).json({ success: false, message: 'Photo requise' });
    }

    const { error } = await supabase.from('menu_photo').insert({
      photo_base64: photo,
      date_debut: date_debut || '',
      date_fin: date_fin || '',
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/menu-photo :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Retourne toute la carte groupée par catégorie.
 */
app.get('/api/carte', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('carte')
      .select('*')
      .eq('actif', true)
      .order('categorie', { ascending: true })
      .order('ordre', { ascending: true });

    if (error) throw error;
    res.json({ success: true, carte: groupCarte(data || []), plats: data || [] });
  } catch (err) {
    console.error('GET /api/carte :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Remplace toute la carte.
 */
app.post('/api/carte', authMiddleware, async (req, res) => {
  try {
    const plats = Array.isArray(req.body) ? req.body : req.body.plats;
    if (!Array.isArray(plats)) {
      return res.status(400).json({ success: false, message: 'Tableau de plats requis' });
    }

    await supabase.from('carte').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (plats.length) {
      const rows = plats.map((plat, index) => ({
        categorie: plat.categorie,
        nom: plat.nom,
        description: plat.description || null,
        prix: plat.prix,
        ordre: plat.ordre ?? index,
        actif: plat.actif ?? true,
      }));

      const { error } = await supabase.from('carte').insert(rows);
      if (error) throw error;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/carte :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Met à jour les paramètres principaux.
 */
app.post('/api/parametres', authMiddleware, async (req, res) => {
  try {
    const { capacite_max, telephone_restaurant, email_restaurant } = req.body;
    const current = await getParametres();
    const payload = {
      capacite_max,
      telephone_restaurant,
      email_restaurant: email_restaurant || current.email_restaurant,
      updated_at: new Date().toISOString(),
    };

    if (current.id) {
      const { error } = await supabase
        .from('parametres')
        .update(payload)
        .eq('id', current.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('parametres').insert(payload);
      if (error) throw error;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/parametres :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Retourne les paramètres au dashboard.
 */
app.get('/api/parametres', authMiddleware, async (req, res) => {
  try {
    const parametres = await getParametres();
    res.json({ success: true, parametres });
  } catch (err) {
    console.error('GET /api/parametres :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ── Démarrage ─────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Le Beaufortois — serveur sur le port ${PORT} (0.0.0.0)`);
});
