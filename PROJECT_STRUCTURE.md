# Structure du Projet ENNA ATC

**Version:** 1.0.0  
**Date:** Décembre 2025  
**Projet:** Système de Gestion des Incidents Techniques - ENNA

---

## Vue d'Ensemble

Le projet ENNA ATC est une application web complète pour la gestion des incidents techniques dans le domaine de la navigation aérienne. Il est composé d'un backend Django REST Framework et d'un frontend React TypeScript.

```
ENNA/
├── backend/                    # Backend Django REST Framework
├── src/                        # Frontend React TypeScript
├── public/                     # Assets statiques
├── docs/                       # Documentation du projet
├── package.json               # Dépendances frontend
├── vite.config.ts             # Configuration Vite
├── tsconfig.json              # Configuration TypeScript
├── tailwind.config.js         # Configuration Tailwind CSS
├── postcss.config.js          # Configuration PostCSS
├── start.sh                    # Script de démarrage local
├── stop.sh                     # Script d'arrêt local
└── README.md                   # Documentation principale
```

---

## Backend (`backend/`)

### Structure Principale

```
backend/
├── api/                        # Application Django principale
│   ├── __init__.py
│   ├── admin.py               # Configuration Django Admin
│   ├── apps.py                # Configuration de l'application
│   ├── models.py              # Modèles de données (User, Equipement, HardwareIncident, SoftwareIncident, Report)
│   ├── serializers.py         # Sérialiseurs DRF pour l'API
│   ├── views.py               # ViewSets et vues API
│   ├── permissions.py         # Classes de permissions RBAC
│   ├── urls.py                # Routes API
│   ├── management/            # Commandes de gestion Django
│   │   ├── __init__.py
│   │   └── commands/
│   │       ├── __init__.py
│   │       ├── create_default_users.py    # Création utilisateurs par défaut
│   │       ├── create_test_data.py        # Génération données de test
│   │       └── fix_anomaly_types.py       # Correction types d'anomalie
│   └── migrations/            # Migrations base de données
│       ├── __init__.py
│       ├── 0001_initial.py
│       ├── 0002_update_incident_models.py
│       ├── 0003_update_roles_and_add_lockout.py
│       └── 0004_update_software_incident_fields.py
│
├── enna_backend/              # Configuration du projet Django
│   ├── __init__.py
│   ├── settings.py            # Configuration Django (DB, CORS, JWT, etc.)
│   ├── urls.py                # URLs principales du projet
│   └── wsgi.py                # WSGI pour déploiement
│
├── scripts/                   # Scripts utilitaires
│   ├── create_test_data.sh
│   ├── run_django.sh
│   ├── run_migrations_final.sh
│   └── archive/               # Scripts archivés
│
├── docs/                      # Documentation backend
│
├── venv/                      # Environnement virtuel Python (généré)
│
├── manage.py                  # CLI Django
├── requirements.txt           # Dépendances Python
├── .env                       # Variables d'environnement (local)
├── .env.example               # Template variables d'environnement
├── setup_django.sh             # Script de configuration Django
├── setup_db_password.sh        # Script configuration DB avec mot de passe
├── setup_password_auth.sh      # Script configuration authentification
├── start_render.sh            # Script démarrage sur Render
└── README.md                  # Documentation backend
```

### Fichiers Clés Backend

#### `api/models.py`
- **User** : Modèle utilisateur personnalisé avec rôles et verrouillage de compte
- **Equipement** : Modèle équipement matériel
- **HardwareIncident** : Modèle incident matériel
- **SoftwareIncident** : Modèle incident logiciel
- **Report** : Modèle rapport d'analyse (relation 1:1 avec SoftwareIncident)

#### `api/views.py`
- **LoginView** : Authentification JWT
- **LogoutView** : Déconnexion et blacklist token
- **IncidentViewSet** : CRUD incidents (hardware/software)
- **EquipementViewSet** : CRUD équipements
- **ReportViewSet** : CRUD rapports
- **UserViewSet** : CRUD utilisateurs (superadmin uniquement)
- **StatsView** : Statistiques et métriques

#### `api/permissions.py`
- **RoleBasedPermission** : Classe de base pour permissions RBAC
- **CanAccessHardwareIncidents** : Accès incidents matériels
- **CanAccessSoftwareIncidents** : Accès incidents logiciels
- **CanModifyHardwareIncidents** : Modification incidents matériels
- **CanModifySoftwareIncidents** : Modification incidents logiciels
- **IsReadOnlyOrSuperadmin** : Lecture seule pour chef_departement

#### `api/serializers.py`
- Sérialiseurs pour tous les modèles
- Validation des données
- Gestion des relations

#### `api/urls.py`
- Routes API RESTful
- Endpoints d'authentification
- Endpoints CRUD pour toutes les entités

#### `enna_backend/settings.py`
- Configuration base de données PostgreSQL
- Configuration JWT (Simple JWT)
- Configuration CORS
- Configuration sécurité (CSRF, ALLOWED_HOSTS)
- Variables d'environnement

---

## Frontend (`src/`)

### Structure Principale

```
src/
├── components/                # Composants React réutilisables
│   ├── ui/                   # Composants UI de base (Shadcn/ui)
│   │   ├── alert-dialog.tsx
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── toggle.tsx
│   │   └── tooltip.tsx
│   │
│   ├── IncidentForm.tsx      # Formulaire création/modification incidents
│   ├── IncidentTable.tsx     # Tableau affichage incidents
│   ├── Sidebar.tsx           # Navigation latérale
│   ├── Navbar.tsx            # Barre de navigation supérieure
│   ├── Layout.tsx            # Layout principal de l'application
│   ├── ProtectedRoute.tsx    # Route protégée avec vérification permissions
│   ├── StatCard.tsx          # Carte statistique
│   └── ConfirmationDialog.tsx # Dialogue de confirmation
│
├── pages/                     # Pages de l'application
│   ├── Login.tsx             # Page de connexion
│   ├── AdminDashboard.tsx     # Tableau de bord administrateur
│   ├── HardwareDashboard.tsx  # Tableau de bord matériel
│   ├── SoftwareDashboard.tsx  # Tableau de bord logiciel
│   ├── HardwareIncidents.tsx # Gestion incidents matériels
│   ├── SoftwareIncidents.tsx  # Gestion incidents logiciels
│   ├── EditIncident.tsx      # Édition d'un incident
│   ├── History.tsx           # Historique (matériel + logiciel)
│   ├── HistoryHardware.tsx   # Historique matériel uniquement
│   ├── HistorySoftware.tsx   # Historique logiciel uniquement
│   ├── Equipment.tsx         # Gestion équipements
│   ├── Reports.tsx           # Gestion rapports
│   ├── AddReport.tsx         # Création/édition rapport
│   ├── Users.tsx             # Gestion utilisateurs (superadmin)
│   └── NotFound.tsx         # Page 404
│
├── hooks/                     # Hooks React personnalisés
│   ├── useAuth.tsx           # Hook authentification (contexte)
│   ├── usePermissions.ts     # Hook permissions utilisateur
│   └── useIncidents.ts        # Hook gestion incidents (API)
│
├── services/                  # Services API
│   └── api.ts                # Client API centralisé (axios)
│
├── lib/                       # Utilitaires
│   └── utils.ts              # Fonctions utilitaires (cn, etc.)
│
├── App.tsx                    # Composant racine avec routage
├── main.tsx                   # Point d'entrée de l'application
└── index.css                  # Styles globaux
```

### Fichiers Clés Frontend

#### `App.tsx`
- Configuration React Router
- Routes protégées avec `ProtectedRoute`
- Gestion des permissions par route
- Layout global

#### `components/IncidentForm.tsx`
- Formulaire dynamique pour incidents hardware/software
- Validation côté client
- Gestion des champs conditionnels
- Intégration formulaire rapport (pour incidents software)
- Soumission asynchrone

#### `components/Sidebar.tsx`
- Navigation latérale adaptative selon les permissions
- Menu différent selon le rôle utilisateur
- Indicateur de page active

#### `hooks/useAuth.tsx`
- Contexte d'authentification global
- Gestion des tokens JWT (localStorage)
- Refresh automatique des tokens
- État de connexion

#### `hooks/usePermissions.ts`
- Calcul des permissions selon le rôle
- Permissions booléennes pour chaque fonctionnalité
- Utilisé par les composants pour masquer/afficher

#### `hooks/useIncidents.ts`
- Hook personnalisé pour interactions API incidents
- Fonctions CRUD (create, read, update, delete)
- Cache avec TanStack Query
- Gestion des erreurs

#### `services/api.ts`
- Client API centralisé (axios)
- Configuration base URL
- Intercepteurs pour tokens JWT
- Gestion des erreurs globales
- Types TypeScript pour toutes les entités

#### `pages/AdminDashboard.tsx`
- Tableau de bord consolidé
- Statistiques matérielles et logicielles
- Graphiques (Recharts)
- Filtres par période (année, mois, semaine)
- Graphiques par équipement, serveur, type d'anomalie

---

## Configuration et Scripts

### Fichiers de Configuration

#### `package.json`
- Dépendances frontend (React, TypeScript, Vite, etc.)
- Scripts npm (dev, build, preview)
- Configuration du projet

#### `vite.config.ts`
- Configuration Vite (build tool)
- Alias de chemins (@/ pour src/)
- Configuration proxy pour développement

#### `tsconfig.json`
- Configuration TypeScript
- Options de compilation
- Chemins et alias

#### `tailwind.config.js`
- Configuration Tailwind CSS
- Thème personnalisé
- Couleurs et variables

#### `backend/requirements.txt`
- Dépendances Python
- Django, DRF, Simple JWT, psycopg, etc.

### Scripts Utilitaires

#### `start.sh`
- Script de démarrage local
- Démarre backend (Django) et frontend (Vite)
- Vérification santé des services

#### `stop.sh`
- Script d'arrêt
- Arrête tous les processus

#### `backend/setup_django.sh`
- Configuration Django
- Création venv
- Installation dépendances
- Migrations

#### `backend/start_render.sh`
- Script de démarrage pour Render.com
- Configuration production
- Migrations automatiques

---

## Documentation (`docs/`)

```
docs/
├── CAHIER_DES_CHARGES.md     # Cahier des charges complet
├── POSTGRESQL_MIGRATION.md   # Guide migration PostgreSQL
└── archive/                  # Documentation archivée
```

---

## Assets Statiques (`public/`)

```
public/
├── enna.png                  # Logo ENNA
└── favicon.ico               # Favicon
```

---

## Variables d'Environnement

### Backend (`.env`)
```
DB_NAME=enna_db
DB_USER=postgres
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5433
SECRET_KEY=<secret-key>
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend (`.env`)
```
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Base de Données

### Tables Principales

1. **users** - Utilisateurs avec rôles
2. **equipement** - Équipements matériels
3. **hardware_incidents** - Incidents matériels
4. **software_incidents** - Incidents logiciels
5. **reports** - Rapports d'analyse (1:1 avec software_incidents)

### Relations

- `hardware_incidents.equipement_id` → `equipement.id` (FK optionnelle)
- `reports.software_incident_id` → `software_incidents.id` (FK unique, 1:1)

---

## Architecture Technique

### Stack Technologique

**Frontend:**
- React 18.3.1
- TypeScript 5.8.3
- Vite 5.4.19
- React Router DOM 6.30.1
- TanStack Query 5.83.0
- Tailwind CSS 3.4.17
- Radix UI (composants)
- Recharts 3.4.1
- Axios

**Backend:**
- Django 5.0.1
- Django REST Framework 3.14.0
- djangorestframework-simplejwt 5.3.0
- PostgreSQL (psycopg 3.3.2)
- django-cors-headers 4.3.1

**Déploiement:**
- Frontend: Vercel
- Backend: Render.com
- Database: Render PostgreSQL

---

## Conventions de Nommage

### Backend (Python)
- **Fichiers:** `snake_case.py`
- **Classes:** `PascalCase`
- **Fonctions/Variables:** `snake_case`
- **Constantes:** `UPPER_SNAKE_CASE`

### Frontend (TypeScript/React)
- **Fichiers composants:** `PascalCase.tsx`
- **Composants:** `PascalCase`
- **Fonctions/Variables:** `camelCase`
- **Types/Interfaces:** `PascalCase`
- **Constantes:** `UPPER_SNAKE_CASE`

### Base de Données
- **Tables:** `snake_case`
- **Colonnes:** `snake_case`
- **Index:** `idx_<table>_<column>`

---

## Workflow de Développement

### Développement Local

1. **Backend:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py create_default_users
   python manage.py runserver
   ```

2. **Frontend:**
   ```bash
   npm install
   npm run dev
   ```

3. **Script automatique:**
   ```bash
   ./start.sh
   ```

### Déploiement

1. **Backend (Render):**
   - Push vers Git
   - Render détecte automatiquement
   - Exécute `setup_django.sh`
   - Migrations automatiques
   - Démarre avec `start_render.sh`

2. **Frontend (Vercel):**
   - Push vers Git
   - Vercel détecte automatiquement
   - Build avec Vite
   - Déploiement sur CDN

---

## Structure des Permissions

Les permissions sont gérées à deux niveaux :

1. **Backend (`api/permissions.py`):**
   - Classes de permissions DRF
   - Vérification côté serveur à chaque requête

2. **Frontend (`hooks/usePermissions.ts`):**
   - Calcul des permissions selon le rôle
   - Masquage des fonctionnalités non autorisées
   - Protection des routes

---

## Points d'Entrée

### Backend
- **API Base URL:** `/api/`
- **Admin Django:** `/admin/` (si activé)

### Frontend
- **Application:** `/`
- **Login:** `/login` (redirection automatique si non authentifié)

---

## Tests et Qualité

### Backend
- Tests Django (à implémenter)
- Migrations vérifiées
- Validation des modèles

### Frontend
- TypeScript strict
- ESLint (à configurer)
- Validation des formulaires

---

**Document préparé par :** Équipe de Développement ENNA ATC  
**Date de dernière mise à jour :** Décembre 2025  
**Version du document :** 1.0.0
