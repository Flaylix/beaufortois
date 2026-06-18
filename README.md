# Le Beaufortois — Site restaurant

Application full-stack pour le restaurant Le Beaufortois : site vitrine, réservations en ligne, dashboard admin, SMS Twilio.

## Stack

- **Frontend** : HTML / CSS / JS vanilla (`index.html`)
- **Backend** : Node.js + Express (`server.js`)
- **Base de données** : Supabase (PostgreSQL)
- **Emails & SMS** : Brevo
- **Déploiement** : Railway

## Installation locale

```bash
npm install
cp .env .env.local   # puis remplir les variables
node server.js
```

Ouvrir http://localhost:3000

## Variables d'environnement (`.env`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_KEY` | Clé service_role (Settings → API) |
| `BREVO_API_KEY` | Clé API Brevo (emails + SMS réservation) |
| `BREVO_SENDER_EMAIL` | Expéditeur Brevo vérifié (ex : leo0703ca@gmail.com) |
| `RESTAURANT_EMAIL` | Email de contact du restaurant |
| `RESTAURANT_NAME` | Nom affiché (emails et SMS) |
| `RESTAURANT_PHONE` | Téléphone pour SMS nouvelle résa (format 06XXXXXXXX) |
| `ADMIN_CODE` | Code PIN admin (défaut : 2503) |
| `JWT_SECRET` | Secret pour signer les tokens admin |
| `PORT` | Défini automatiquement par Railway — ne pas ajouter |

## Supabase — Tables à créer

Exécuter ce SQL dans l'éditeur SQL Supabase :

```sql
-- Réservations
CREATE TABLE reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  email TEXT,
  date DATE NOT NULL,
  heure TEXT NOT NULL,
  personnes INT NOT NULL DEFAULT 1,
  message TEXT,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Menu du jour
CREATE TABLE menu_jour (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entree TEXT,
  plat TEXT,
  dessert TEXT,
  prix TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Carte des plats
CREATE TABLE carte (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categorie TEXT NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  prix TEXT,
  ordre INT DEFAULT 0,
  actif BOOLEAN DEFAULT true
);

-- Paramètres restaurant
CREATE TABLE parametres (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  capacite_max INT DEFAULT 40,
  telephone_restaurant TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ligne par défaut
INSERT INTO parametres (capacite_max, telephone_restaurant)
VALUES (40, '+33600000000');
```

## API

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/reservation` | — | Créer une réservation |
| `GET` | `/api/menu` | — | Menu du jour |
| `GET` | `/api/carte` | — | Carte des plats |
| `POST` | `/api/admin/login` | — | Connexion admin (PIN) |
| `GET` | `/api/reservations?date=` | JWT | Réservations du jour |
| `PATCH` | `/api/reservation/:id` | JWT | Confirmer / annuler |
| `POST` | `/api/menu` | JWT | Publier le menu du jour |
| `POST` | `/api/carte` | JWT | Modifier la carte |
| `GET` | `/api/stats` | JWT | Statistiques du jour |
| `GET` | `/api/parametres` | JWT | Paramètres restaurant |
| `POST` | `/api/parametres` | JWT | Modifier les paramètres |

## Dashboard admin

1. Cliquer sur **Admin** (discret, en bas du footer)
2. Entrer le code PIN (`ADMIN_CODE`, défaut `2503`)
3. Gérer réservations, menu du jour, carte et paramètres

## Déploiement Railway

1. Créer un projet sur [railway.app](https://railway.app)
2. Connecter ce dépôt GitHub
3. **Variables** → **Raw Editor** → coller les variables (voir `.env.example`)
4. Remplir les valeurs depuis ton fichier `.env` local
5. Railway lance `npm start` automatiquement
6. Générer un domaine public : **Settings** → **Networking** → **Generate Domain**

### Variables à ajouter dans Railway

```
SUPABASE_URL
SUPABASE_SERVICE_KEY
BREVO_API_KEY
BREVO_SENDER_EMAIL
RESTAURANT_NAME
RESTAURANT_EMAIL
RESTAURANT_PHONE
ADMIN_CODE
JWT_SECRET
```

> Ne pas ajouter `PORT` — Railway le gère tout seul.

## Structure

```
beaufortois/
├── index.html      # Frontend complet (site + admin)
├── server.js       # Backend Express
├── package.json
├── .env            # Variables (ne pas committer)
└── README.md
```
