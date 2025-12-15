# Cahier des Charges - ENNA ATC
## Système de Gestion des Incidents Techniques

**Version:** 1.0.0  
**Date:** Décembre 2025  
**Client:** ENNA (École Nationale de la Navigation Aérienne)

---

## Table des Matières

1. [Introduction](#1-introduction)
2. [Contexte et Objectifs](#2-contexte-et-objectifs)
3. [Spécifications Fonctionnelles](#3-spécifications-fonctionnelles)
4. [Spécifications Techniques](#4-spécifications-techniques)
5. [Architecture du Système](#5-architecture-du-système)
6. [Structure de la Base de Données](#6-structure-de-la-base-de-données)
7. [Description de l'Interface](#7-description-de-linterface)
8. [Sécurité et Authentification](#8-sécurité-et-authentification)
9. [Déploiement et Infrastructure](#9-déploiement-et-infrastructure)
10. [Développement et Maintenance](#10-développement-et-maintenance)

---

## 1. Introduction

### 1.1 Présentation du Projet

Le système ENNA ATC (Air Traffic Control) est une application web complète dédiée à la gestion des incidents techniques dans le domaine de la navigation aérienne. Le système permet de gérer deux types d'incidents distincts : les incidents matériels (hardware) et les incidents logiciels (software), avec un système de rapports intégré.

### 1.2 Portée du Projet

Ce document décrit les spécifications fonctionnelles et techniques complètes du système, incluant :
- La gestion des utilisateurs et des rôles
- La gestion des incidents matériels et logiciels
- La gestion des équipements
- Le système de rapports
- Les tableaux de bord et statistiques
- L'interface utilisateur

---

## 2. Contexte et Objectifs

### 2.1 Contexte

L'ENNA nécessite un système centralisé pour :
- Enregistrer et suivre les incidents techniques
- Gérer les équipements de navigation aérienne
- Générer des rapports d'analyse d'incidents
- Fournir des statistiques et tableaux de bord pour la prise de décision
- Assurer la traçabilité des interventions

### 2.2 Objectifs

**Objectifs Fonctionnels :**
- Centraliser la gestion des incidents techniques
- Séparer les responsabilités par type d'incident (matériel/logiciel)
- Fournir un historique complet des interventions
- Générer des rapports d'analyse structurés
- Offrir des statistiques en temps réel

**Objectifs Techniques :**
- Application web moderne et responsive
- Architecture sécurisée avec authentification JWT
- Contrôle d'accès basé sur les rôles (RBAC)
- API RESTful pour l'intégration future
- Déploiement cloud scalable

---

## 3. Spécifications Fonctionnelles

### 3.1 Gestion des Utilisateurs

#### 3.1.1 Rôles et Permissions

Le système définit quatre rôles principaux :

**1. Service Maintenance (`service_maintenance`)**
- **Accès :** Incidents matériels uniquement
- **Permissions :**
  - CRUD complet sur les incidents matériels
  - CRUD complet sur les équipements
  - Consultation de l'historique des incidents matériels
  - Accès au tableau de bord matériel

**2. Service Integration et Développement (`service_integration`)**
- **Accès :** Incidents logiciels uniquement
- **Permissions :**
  - CRUD complet sur les incidents logiciels
  - CRUD complet sur les rapports d'analyse
  - Consultation de l'historique des incidents logiciels
  - Accès au tableau de bord logiciel

**3. Chef de Département (`chef_departement`)**
- **Accès :** Vue globale en lecture seule
- **Permissions :**
  - Consultation de tous les tableaux de bord
  - Consultation de l'historique complet (matériel et logiciel)
  - Lecture seule de tous les incidents et rapports
  - Accès aux statistiques globales

**4. Super Admin (`superadmin`)**
- **Accès :** Accès complet au système
- **Permissions :**
  - Toutes les permissions des autres rôles
  - Gestion des utilisateurs (création, modification, suppression)
  - Accès à toutes les fonctionnalités administratives

#### 3.1.2 Authentification et Sécurité

- **Authentification :** JWT (JSON Web Tokens)
- **Sécurité des mots de passe :**
  - Minimum 8 caractères
  - Validation côté serveur
- **Protection contre les attaques :**
  - Verrouillage de compte après 5 tentatives échouées
  - Durée de verrouillage : 15 minutes
  - Rotation des tokens de rafraîchissement
  - Blacklist des tokens lors de la déconnexion

### 3.2 Gestion des Incidents Matériels

#### 3.2.1 Champs de l'Incident Matériel

- **Informations de base :**
  - Date et heure de l'incident
  - Nom de l'équipement
  - Partition
  - Numéro de série
  - Description de l'incident

- **Détails techniques :**
  - Anomalie observée
  - Action réalisée
  - Pièce de rechange utilisée
  - État de l'équipement après intervention
  - Recommandations

- **Métadonnées :**
  - Type de maintenance (Préventive/Corrective)
  - Durée d'arrêt (en minutes)
  - Lien vers l'équipement (optionnel)
  - Date de création et de mise à jour

#### 3.2.2 Fonctionnalités

- Création, modification, suppression d'incidents
- Recherche et filtrage
- Association avec les équipements
- Export et impression des données
- Historique complet des interventions

### 3.3 Gestion des Incidents Logiciels

#### 3.3.1 Champs de l'Incident Logiciel

- **Informations de base :**
  - Date et heure de l'incident
  - Description
  - Sujet
  - Commentaires

- **Contexte opérationnel :**
  - Simulateur (Oui/Non)
  - Salle opérationnelle (Oui/Non)
  - Serveur
  - Partition
  - Position STA

- **Informations techniques :**
  - Type d'anomalie
  - Indicatif
  - Nom du radar
  - FL (Flight Level)
  - Longitude et Latitude
  - Code SSR

#### 3.3.2 Fonctionnalités

- Création, modification, suppression d'incidents
- Recherche et filtrage avancé
- Génération de rapports d'analyse
- Export et impression
- Historique complet

### 3.4 Gestion des Rapports

#### 3.4.1 Structure du Rapport

Chaque incident logiciel peut avoir un rapport d'analyse associé :

- **Date et heure du rapport**
- **Anomalie :** Description détaillée de l'anomalie
- **Analyse :** Analyse technique approfondie
- **Conclusion :** Conclusions et recommandations

#### 3.4.2 Fonctionnalités

- Création et modification de rapports
- Association un-à-un avec les incidents logiciels
- Impression des rapports
- Export PDF (via impression navigateur)

### 3.5 Gestion des Équipements

#### 3.5.1 Champs de l'Équipement

- Numéro de série
- Nom de l'équipement
- Partition
- État (actuel/hors service/etc.)
- Date de création et de mise à jour

#### 3.5.2 Fonctionnalités

- CRUD complet sur les équipements
- Association avec les incidents matériels
- Historique des interventions par équipement
- Recherche et filtrage

### 3.6 Tableaux de Bord et Statistiques

#### 3.6.1 Tableau de Bord Matériel

**Statistiques affichées :**
- Nombre total d'incidents matériels
- Durée totale d'arrêt
- Répartition par type de maintenance (Préventive/Corrective)
- Évolution sur 7 et 30 derniers jours
- Incidents récents (5 derniers)

#### 3.6.2 Tableau de Bord Logiciel

**Statistiques affichées :**
- Nombre total d'incidents logiciels
- Répartition par type d'anomalie
- Évolution sur 7 et 30 derniers jours
- Incidents récents (5 derniers)
- Nombre de rapports générés

#### 3.6.3 Tableau de Bord Administrateur

**Vue consolidée :**
- Statistiques matérielles et logicielles
- Vue globale de tous les incidents
- Statistiques par période
- Graphiques de tendances

---

## 4. Spécifications Techniques

### 4.1 Stack Technologique

#### 4.1.1 Frontend

**Framework et Bibliothèques :**
- **React 18.3.1** - Bibliothèque JavaScript pour interfaces utilisateur
- **TypeScript 5.8.3** - Typage statique pour JavaScript
- **Vite 5.4.19** - Build tool et serveur de développement
- **React Router DOM 6.30.1** - Routage côté client

**UI Components :**
- **Radix UI** - Composants UI accessibles et sans style
  - Alert Dialog, Dialog, Label, Select, Separator, Tabs, Toast, Tooltip
- **Tailwind CSS 3.4.17** - Framework CSS utility-first
- **Lucide React** - Bibliothèque d'icônes
- **Recharts 3.4.1** - Bibliothèque de graphiques React
- **Sonner** - Système de notifications toast

**State Management :**
- **React Hooks** - Gestion d'état locale
- **TanStack Query 5.83.0** - Gestion des données serveur et cache

#### 4.1.2 Backend

**Framework :**
- **Django 5.0.1** - Framework web Python
- **Django REST Framework 3.14.0** - Toolkit pour construire des APIs REST

**Authentification :**
- **djangorestframework-simplejwt 5.3.0** - Implémentation JWT pour DRF

**Base de Données :**
- **PostgreSQL** - Base de données relationnelle
- **psycopg 3.3.2** - Adaptateur PostgreSQL pour Python

**Sécurité et CORS :**
- **django-cors-headers 4.3.1** - Gestion des en-têtes CORS
- **python-decouple 3.8** - Gestion des variables d'environnement

#### 4.1.3 Infrastructure

**Déploiement :**
- **Render.com** - Hébergement backend et base de données
- **Vercel** - Hébergement frontend

**Outils de Développement :**
- **Git** - Contrôle de version
- **ESLint** - Linter JavaScript/TypeScript
- **PostgreSQL 16+** - Base de données

### 4.2 Architecture du Système

#### 4.2.1 Architecture Générale

```
┌─────────────────┐
│   Frontend      │
│   (Vercel)      │
│   React + TS    │
└────────┬────────┘
         │ HTTPS
         │ API Calls
         ▼
┌─────────────────┐
│   Backend API   │
│   (Render)      │
│   Django REST   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Render)      │
└─────────────────┘
```

#### 4.2.2 Architecture Frontend

**Structure des Composants :**

```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI de base
│   ├── IncidentForm.tsx
│   ├── IncidentTable.tsx
│   ├── Sidebar.tsx
│   └── ...
├── pages/              # Pages de l'application
│   ├── Login.tsx
│   ├── AdminDashboard.tsx
│   ├── HardwareIncidents.tsx
│   ├── SoftwareIncidents.tsx
│   └── ...
├── hooks/              # Hooks React personnalisés
│   ├── useAuth.tsx
│   ├── usePermissions.ts
│   ├── useIncidents.ts
│   └── ...
├── services/           # Services API
│   └── api.ts         # Client API centralisé
└── App.tsx            # Composant racine
```

#### 4.2.3 Architecture Backend

**Structure Django :**

```
backend/
├── api/
│   ├── models.py          # Modèles de données
│   ├── serializers.py     # Sérialiseurs DRF
│   ├── views.py           # Vues et ViewSets
│   ├── permissions.py     # Classes de permissions
│   ├── urls.py            # Routes API
│   └── management/
│       └── commands/      # Commandes Django personnalisées
├── enna_backend/
│   ├── settings.py        # Configuration Django
│   └── urls.py            # URLs principales
└── manage.py
```

---

## 5. Architecture du Système

### 5.1 Modèle de Données

Le système utilise une architecture relationnelle avec les entités suivantes :

- **User** - Utilisateurs du système
- **Equipement** - Équipements matériels
- **HardwareIncident** - Incidents matériels
- **SoftwareIncident** - Incidents logiciels
- **Report** - Rapports d'analyse (liés aux incidents logiciels)

### 5.2 Flux de Données

**Authentification :**
1. Utilisateur saisit identifiants
2. Backend valide et génère JWT tokens
3. Frontend stocke tokens et les utilise pour les requêtes
4. Refresh automatique des tokens expirés

**Gestion des Incidents :**
1. Utilisateur crée/modifie un incident via le formulaire
2. Frontend envoie requête POST/PUT à l'API
3. Backend valide les données et vérifie les permissions
4. Données sauvegardées en base de données
5. Frontend met à jour l'affichage

---

## 6. Structure de la Base de Données

### 6.1 Schéma Relationnel

```
┌─────────────┐
│    User     │
│─────────────│
│ id (PK)     │
│ username    │
│ password    │
│ role        │
│ created_at  │
│ failed_login│
│ locked_until│
└─────────────┘
      │
      │
┌─────┴──────────────────┐
│                        │
│  ┌──────────────────┐  │
│  │ HardwareIncident │  │
│  │──────────────────│  │
│  │ id (PK)          │  │
│  │ date             │  │
│  │ time             │  │
│  │ nom_equipement   │  │
│  │ partition        │  │
│  │ numero_serie     │  │
│  │ equipement_id    │──┼──┐
│  │ description      │  │  │
│  │ anomalie_observee│  │  │
│  │ action_realisee  │  │  │
│  │ ...              │  │  │
│  └──────────────────┘  │  │
│                        │  │
│  ┌──────────────────┐  │  │
│  │  Equipement      │◄─┼──┘
│  │──────────────────│  │
│  │ id (PK)          │  │
│  │ num_serie        │  │
│  │ nom_equipement   │  │
│  │ partition        │  │
│  │ etat             │  │
│  └──────────────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │SoftwareIncident  │  │
│  │──────────────────│  │
│  │ id (PK)          │  │
│  │ date             │  │
│  │ time             │  │
│  │ simulateur       │  │
│  │ salle_operation  │  │
│  │ server           │  │
│  │ position_STA     │  │
│  │ type_anomalie    │  │
│  │ indicatif        │  │
│  │ nom_radar        │  │
│  │ FL               │  │
│  │ longitude        │  │
│  │ latitude         │  │
│  │ code_SSR         │  │
│  │ sujet            │  │
│  │ description      │  │
│  │ commentaires     │  │
│  └────────┬─────────┘  │
│           │            │
│           │ 1:1        │
│           ▼            │
│  ┌──────────────────┐ │
│  │     Report        │ │
│  │──────────────────│ │
│  │ id (PK)          │ │
│  │ software_incident│ │
│  │ date             │ │
│  │ time             │ │
│  │ anomaly          │ │
│  │ analysis         │ │
│  │ conclusion       │ │
│  └──────────────────┘ │
└────────────────────────┘
```

### 6.2 Tables Détaillées

#### 6.2.1 Table `users`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| username | VARCHAR(150) | UNIQUE, NOT NULL | Nom d'utilisateur |
| password | VARCHAR(128) | NOT NULL | Mot de passe hashé |
| role | VARCHAR(30) | NOT NULL | Rôle utilisateur |
| created_at | TIMESTAMP | DEFAULT NOW() | Date de création |
| failed_login_attempts | INTEGER | DEFAULT 0 | Tentatives échouées |
| locked_until | TIMESTAMP | NULL | Date de déverrouillage |
| is_active | BOOLEAN | DEFAULT TRUE | Compte actif |
| is_staff | BOOLEAN | DEFAULT FALSE | Accès admin Django |
| is_superuser | BOOLEAN | DEFAULT FALSE | Super utilisateur |

**Rôles possibles :**
- `service_maintenance`
- `service_integration`
- `chef_departement`
- `superadmin`

#### 6.2.2 Table `equipement`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| num_serie | VARCHAR(255) | NULL | Numéro de série |
| nom_equipement | VARCHAR(255) | NOT NULL | Nom de l'équipement |
| partition | VARCHAR(255) | NOT NULL | Partition |
| etat | VARCHAR(50) | DEFAULT 'actuel' | État de l'équipement |
| created_at | TIMESTAMP | DEFAULT NOW() | Date de création |
| updated_at | TIMESTAMP | AUTO UPDATE | Date de mise à jour |

#### 6.2.3 Table `hardware_incidents`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Identifiant unique |
| date | DATE | NOT NULL | Date de l'incident |
| time | TIME | NOT NULL | Heure de l'incident |
| nom_de_equipement | VARCHAR(255) | NOT NULL | Nom équipement |
| partition | VARCHAR(255) | NULL | Partition |
| numero_de_serie | VARCHAR(255) | NULL | Numéro de série |
| equipement_id | INTEGER | NULL, FK → equipement.id | Lien équipement |
| description | TEXT | NOT NULL | Description |
| anomalie_observee | TEXT | NULL | Anomalie observée |
| action_realisee | TEXT | NULL | Action réalisée |
| piece_de_rechange_utilisee | TEXT | NULL | Pièces utilisées |
| etat_equipement_apres_intervention | TEXT | NULL | État après intervention |
| recommendation | TEXT | NULL | Recommandations |
| duree_arret | INTEGER | NULL | Durée arrêt (minutes) |
| maintenance_type | VARCHAR(20) | NULL | Type maintenance |
| created_at | TIMESTAMP | DEFAULT NOW() | Date création |
| updated_at | TIMESTAMP | AUTO UPDATE | Date mise à jour |

**Types de maintenance :**
- `preventive` - Préventive
- `corrective` - Corrective

#### 6.2.4 Table `software_incidents`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Identifiant unique |
| date | DATE | NOT NULL | Date de l'incident |
| time | TIME | NOT NULL | Heure de l'incident |
| simulateur | BOOLEAN | DEFAULT FALSE | Simulateur |
| salle_operationnelle | BOOLEAN | DEFAULT FALSE | Salle opérationnelle |
| server | VARCHAR(255) | NULL | Serveur |
| partition | VARCHAR(255) | NULL | Partition |
| position_STA | VARCHAR(255) | NULL | Position STA |
| type_d_anomalie | VARCHAR(255) | NULL | Type d'anomalie |
| indicatif | VARCHAR(255) | NULL | Indicatif |
| nom_radar | VARCHAR(255) | NULL | Nom du radar |
| FL | VARCHAR(255) | NULL | Flight Level |
| longitude | VARCHAR(255) | NULL | Longitude |
| latitude | VARCHAR(255) | NULL | Latitude |
| code_SSR | VARCHAR(255) | NULL | Code SSR |
| sujet | VARCHAR(255) | NULL | Sujet |
| description | TEXT | NOT NULL | Description |
| commentaires | TEXT | NULL | Commentaires |
| created_at | TIMESTAMP | DEFAULT NOW() | Date création |
| updated_at | TIMESTAMP | AUTO UPDATE | Date mise à jour |

#### 6.2.5 Table `reports`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Identifiant unique |
| software_incident_id | INTEGER | UNIQUE, FK → software_incidents.id | Incident associé |
| date | DATE | NOT NULL | Date du rapport |
| time | TIME | NOT NULL | Heure du rapport |
| anomaly | TEXT | NOT NULL | Description anomalie |
| analysis | TEXT | NOT NULL | Analyse technique |
| conclusion | TEXT | NOT NULL | Conclusion |
| created_at | TIMESTAMP | DEFAULT NOW() | Date création |
| updated_at | TIMESTAMP | AUTO UPDATE | Date mise à jour |

**Relation :** Un rapport est associé à un seul incident logiciel (relation 1:1)

### 6.3 Index et Contraintes

**Index créés automatiquement :**
- Clés primaires sur toutes les tables
- Clés étrangères avec index
- Index sur `created_at` pour les requêtes de tri

**Contraintes :**
- UNIQUE sur `username` dans `users`
- UNIQUE sur `software_incident_id` dans `reports`
- FOREIGN KEY `equipement_id` → `equipement.id`
- FOREIGN KEY `software_incident_id` → `software_incidents.id`

---

## 7. Description de l'Interface

### 7.1 Architecture de l'Interface

L'interface suit une architecture moderne avec :
- **Layout responsive** - Adapté mobile, tablette et desktop
- **Navigation latérale** - Menu sidebar avec icônes
- **Header** - Barre supérieure avec informations utilisateur
- **Zone de contenu principale** - Affichage dynamique selon la route

### 7.2 Pages Principales

#### 7.2.1 Page de Connexion (`/login`)

**Éléments :**
- Formulaire de connexion centré
- Champs : Username, Password
- Bouton de connexion
- Gestion des erreurs (compte verrouillé, identifiants invalides)
- Design moderne avec fond dégradé

#### 7.2.2 Tableaux de Bord

**Tableau de Bord Administrateur (`/dashboard`)**
- Vue consolidée matériel + logiciel
- Statistiques globales
- Graphiques de tendances
- Liste des incidents récents

**Tableau de Bord Matériel (`/dashboard/hardware`)**
- Nombre total d'incidents matériels
- Durée totale d'arrêt
- Répartition par type de maintenance
- Graphiques d'évolution
- Incidents récents

**Tableau de Bord Logiciel (`/dashboard/software`)**
- Nombre total d'incidents logiciels
- Répartition par type d'anomalie
- Graphiques d'évolution
- Incidents récents

#### 7.2.3 Gestion des Incidents

**Page Incidents Matériels (`/incidents/hardware`)**
- Formulaire de création/modification
- Tableau listant tous les incidents
- Actions : Créer, Modifier, Supprimer
- Recherche et filtrage
- Export/Impression

**Page Incidents Logiciels (`/incidents/software`)**
- Formulaire de création/modification
- Tableau listant tous les incidents
- Actions : Créer, Modifier, Supprimer, Ajouter Rapport
- Recherche et filtrage
- Export/Impression

#### 7.2.4 Historique

**Page Historique (`/history`)**
- Onglets séparés Matériel/Logiciel
- Filtrage par période
- Recherche textuelle
- Affichage détaillé de chaque incident
- Impression des rapports (logiciels)

**Pages Historique Séparées :**
- `/history/hardware` - Historique matériel uniquement
- `/history/software` - Historique logiciel uniquement

#### 7.2.5 Gestion des Équipements (`/equipment`)

- Liste de tous les équipements
- Formulaire de création/modification
- Actions : Créer, Modifier, Supprimer
- Recherche par nom, numéro de série, partition
- Association avec incidents matériels

#### 7.2.6 Gestion des Utilisateurs (`/users`) - Super Admin uniquement

- Liste de tous les utilisateurs
- Formulaire de création/modification
- Actions : Créer, Modifier, Supprimer
- Attribution de rôles
- Gestion des permissions

### 7.3 Composants Réutilisables

#### 7.3.1 IncidentForm

Formulaire dynamique pour créer/modifier les incidents :
- Validation côté client
- Champs conditionnels selon le type
- Gestion des erreurs
- Soumission asynchrone

#### 7.3.2 IncidentTable

Tableau réutilisable pour afficher les incidents :
- Colonnes configurables
- Tri et filtrage
- Actions contextuelles (Modifier, Supprimer)
- Mode impression optimisé
- Pagination

#### 7.3.3 Sidebar

Navigation latérale :
- Menu adaptatif selon les permissions
- Icônes pour chaque section
- Indicateur de page active
- Masquage automatique des sections non autorisées

#### 7.3.4 StatCard

Carte de statistique :
- Valeur principale
- Label descriptif
- Icône optionnelle
- Variation (augmentation/diminution)
- Design moderne avec ombres

### 7.4 Design System

**Couleurs :**
- Primaire : Bleu (#3b82f6)
- Secondaire : Gris (#6b7280)
- Succès : Vert (#10b981)
- Erreur : Rouge (#ef4444)
- Avertissement : Orange (#f59e0b)

**Typographie :**
- Police principale : System fonts (sans-serif)
- Tailles : xs, sm, base, lg, xl, 2xl, 3xl
- Poids : 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

**Espacements :**
- Système cohérent basé sur Tailwind CSS
- Marges et paddings standardisés

**Composants UI :**
- Boutons avec variantes (primary, secondary, outline, ghost)
- Inputs avec labels et validation
- Dialogs modaux
- Toasts de notification
- Tables responsive
- Cards avec ombres

---

## 8. Sécurité et Authentification

### 8.1 Authentification JWT

**Flux d'authentification :**
1. Utilisateur saisit identifiants
2. Backend valide et génère :
   - Access Token (durée : 1 heure)
   - Refresh Token (durée : 7 jours)
3. Tokens stockés dans localStorage
4. Access Token inclus dans chaque requête API
5. Refresh automatique si access token expiré

**Sécurité des tokens :**
- Rotation des refresh tokens
- Blacklist lors de la déconnexion
- Validation côté serveur à chaque requête
- Expiration automatique

### 8.2 Contrôle d'Accès (RBAC)

**Implémentation :**
- Permissions définies par rôle dans le backend
- Vérification côté serveur à chaque requête
- Masquage des fonctionnalités côté client selon les permissions
- Routes protégées avec composant `ProtectedRoute`

**Matrice de Permissions :**

| Fonctionnalité | Maintenance | Integration | Chef Dep | Superadmin |
|----------------|-------------|-------------|----------|------------|
| Incidents Matériels - Lecture | ✅ | ❌ | ✅ | ✅ |
| Incidents Matériels - Écriture | ✅ | ❌ | ❌ | ✅ |
| Incidents Logiciels - Lecture | ❌ | ✅ | ✅ | ✅ |
| Incidents Logiciels - Écriture | ❌ | ✅ | ❌ | ✅ |
| Équipements - Lecture | ✅ | ❌ | ✅ | ✅ |
| Équipements - Écriture | ✅ | ❌ | ❌ | ✅ |
| Rapports - Lecture | ❌ | ✅ | ✅ | ✅ |
| Rapports - Écriture | ❌ | ✅ | ❌ | ✅ |
| Utilisateurs - Gestion | ❌ | ❌ | ❌ | ✅ |
| Tableaux de Bord | Matériel | Logiciel | Tous | Tous |

### 8.3 Protection des Données

**Mesures de sécurité :**
- Mots de passe hashés avec Django (PBKDF2)
- Validation des données côté serveur
- Protection CSRF (Django)
- CORS configuré pour domaines autorisés uniquement
- HTTPS obligatoire en production
- Variables d'environnement pour secrets

**Protection contre les attaques :**
- Verrouillage de compte après 5 tentatives
- Rate limiting sur les endpoints sensibles
- Validation stricte des entrées
- Protection XSS via React (échappement automatique)
- Protection SQL Injection via ORM Django

---

## 9. Déploiement et Infrastructure

### 9.1 Architecture de Déploiement

**Environnement de Production :**

```
┌─────────────────────────────────────┐
│         Vercel (Frontend)           │
│  https://enna-atc-...vercel.app     │
│  - Build automatique                │
│  - CDN global                       │
│  - HTTPS automatique                │
└──────────────┬──────────────────────┘
               │ HTTPS
               │ API Calls
               ▼
┌─────────────────────────────────────┐
│      Render.com (Backend)           │
│  https://enna-atc-...onrender.com  │
│  - Django REST API                  │
│  - Auto-scaling                     │
│  - Health checks                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Render PostgreSQL (Database)      │
│  - Backup automatique               │
│  - Haute disponibilité              │
│  - Monitoring                       │
└─────────────────────────────────────┘
```

### 9.2 Configuration de Déploiement

#### 9.2.1 Frontend (Vercel)

**Fichier `vercel.json` :**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_BASE_URL": "https://enna-atc-...onrender.com/api"
  }
}
```

**Variables d'environnement :**
- `VITE_API_BASE_URL` - URL de l'API backend

#### 9.2.2 Backend (Render)

**Fichier `render.yaml` :**
- Configuration du service web
- Variables d'environnement depuis la base de données
- Commandes de build et démarrage
- Configuration de la base de données PostgreSQL

**Variables d'environnement :**
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` - Connexion DB
- `SECRET_KEY` - Clé secrète Django (générée automatiquement)
- `DEBUG` - Mode debug (False en production)
- `ALLOWED_HOSTS` - Domaines autorisés
- `RENDER` - Indicateur d'environnement Render

### 9.3 Processus de Déploiement

**Workflow :**
1. Push vers le dépôt Git
2. **Frontend (Vercel) :**
   - Détection automatique du push
   - Build avec Vite
   - Déploiement sur CDN
   - Tests automatiques

3. **Backend (Render) :**
   - Détection automatique du push
   - Exécution de `setup_django.sh` (build)
   - Création/activation venv
   - Installation dépendances
   - Migrations base de données
   - Création utilisateurs par défaut
   - Démarrage avec `start_render.sh`

### 9.4 Monitoring et Logs

**Logs disponibles :**
- Logs de build (Vercel/Render)
- Logs d'application (Render)
- Logs de base de données (Render)
- Logs navigateur (console)

**Monitoring :**
- Health checks automatiques
- Alertes en cas d'erreur
- Métriques de performance

---

## 10. Développement et Maintenance

### 10.1 Environnement de Développement

#### 10.1.1 Prérequis

**Frontend :**
- Node.js 18+
- npm ou yarn
- Git

**Backend :**
- Python 3.11+
- PostgreSQL 16+
- pip

#### 10.1.2 Installation Locale

**1. Cloner le dépôt :**
```bash
git clone <repository-url>
cd ENNA
```

**2. Backend :**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py create_default_users
python manage.py runserver
```

**3. Frontend :**
```bash
npm install
npm run dev
```

**4. Script automatique :**
```bash
./start.sh
```

### 10.2 Structure du Code

#### 10.2.1 Organisation Frontend

```
src/
├── components/        # Composants réutilisables
│   ├── ui/          # Composants UI de base
│   └── ...          # Composants métier
├── pages/           # Pages de l'application
├── hooks/           # Hooks React personnalisés
├── services/        # Services API
├── App.tsx          # Composant racine
└── main.tsx         # Point d'entrée
```

#### 10.2.2 Organisation Backend

```
backend/
├── api/
│   ├── models.py       # Modèles de données
│   ├── serializers.py # Sérialiseurs DRF
│   ├── views.py       # Vues API
│   ├── permissions.py # Permissions RBAC
│   ├── urls.py        # Routes API
│   └── management/
│       └── commands/  # Commandes Django
├── enna_backend/
│   ├── settings.py    # Configuration
│   └── urls.py        # URLs principales
└── manage.py          # CLI Django
```

### 10.3 API Endpoints

#### 10.3.1 Authentification

```
POST   /api/auth/login/          # Connexion
POST   /api/auth/logout/         # Déconnexion
POST   /api/auth/refresh/        # Rafraîchir token
GET    /api/auth/profile/        # Profil utilisateur
POST   /api/auth/update_profile/ # Mettre à jour profil
POST   /api/auth/change_password/# Changer mot de passe
```

#### 10.3.2 Incidents

```
GET    /api/incidents/                    # Liste incidents
GET    /api/incidents/?type=hardware      # Incidents matériels
GET    /api/incidents/?type=software      # Incidents logiciels
POST   /api/incidents/                    # Créer incident
GET    /api/incidents/{id}/               # Détails incident
PUT    /api/incidents/{id}/               # Modifier incident
DELETE /api/incidents/{id}/               # Supprimer incident
GET    /api/incidents/stats/              # Statistiques
GET    /api/incidents/recent/             # Incidents récents
```

#### 10.3.3 Équipements

```
GET    /api/equipement/                   # Liste équipements
POST   /api/equipement/                   # Créer équipement
GET    /api/equipement/{id}/              # Détails équipement
PUT    /api/equipement/{id}/              # Modifier équipement
DELETE /api/equipement/{id}/              # Supprimer équipement
```

#### 10.3.4 Rapports

```
GET    /api/reports/                      # Liste rapports
POST   /api/reports/                      # Créer rapport
GET    /api/reports/{id}/                 # Détails rapport
PUT    /api/reports/{id}/                 # Modifier rapport
DELETE /api/reports/{id}/                 # Supprimer rapport
```

#### 10.3.5 Utilisateurs (Super Admin uniquement)

```
GET    /api/users/                        # Liste utilisateurs
POST   /api/users/                        # Créer utilisateur
GET    /api/users/{id}/                   # Détails utilisateur
PUT    /api/users/{id}/                   # Modifier utilisateur
DELETE /api/users/{id}/                   # Supprimer utilisateur
```

### 10.4 Tests et Qualité

**Tests Frontend :**
- Tests unitaires des composants
- Tests d'intégration des hooks
- Tests E2E des flux utilisateur

**Tests Backend :**
- Tests unitaires des modèles
- Tests des vues API
- Tests des permissions
- Tests d'intégration

**Qualité du Code :**
- ESLint pour le code JavaScript/TypeScript
- Formatage automatique
- Validation TypeScript stricte
- Code review avant merge

### 10.5 Maintenance

**Mises à jour régulières :**
- Mise à jour des dépendances
- Correctifs de sécurité
- Améliorations de performance
- Nouvelles fonctionnalités

**Backup :**
- Backup automatique de la base de données (Render)
- Versioning du code (Git)
- Documentation des changements

**Support :**
- Documentation technique complète
- Guide d'utilisation
- Procédures de dépannage
- Contact support

---

## 11. Utilisateurs par Défaut

### 11.1 Comptes de Test

Tous les utilisateurs par défaut ont le mot de passe : `01010101`

| Username | Rôle | Description |
|----------|------|-------------|
| `admin` | superadmin | Administrateur principal |
| `technicien1` | service_maintenance | Technicien maintenance |
| `technicien2` | service_maintenance | Technicien maintenance |
| `ingenieur1` | service_integration | Ingénieur intégration |
| `ingenieur2` | service_integration | Ingénieur intégration |
| `chefdep1` | chef_departement | Chef de département |
| `superuser1` | superadmin | Super utilisateur |

---

## 12. Conclusion

Ce cahier des charges décrit un système complet de gestion des incidents techniques pour l'ENNA, avec :

- **Architecture moderne** : React + Django REST API
- **Sécurité renforcée** : JWT, RBAC, protection des données
- **Interface intuitive** : Design moderne et responsive
- **Scalabilité** : Déploiement cloud avec auto-scaling
- **Maintenabilité** : Code structuré et documenté

Le système répond aux besoins fonctionnels et techniques requis pour une gestion efficace des incidents techniques dans le domaine de la navigation aérienne.

---

**Document préparé par :** Équipe de Développement ENNA ATC  
**Date de dernière mise à jour :** Décembre 2025  
**Version du document :** 1.0.0
