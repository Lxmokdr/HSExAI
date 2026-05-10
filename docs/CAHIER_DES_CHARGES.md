# Cahier des Charges - Guardian Vision
## Système de Gestion des Incidents Techniques

**Version:** 1.0.0  
**Date:** Décembre 2025  
**Client:** Guardian (Établissement National de la Navigation Aérienne)

---

## Table des Matières

1. [Introduction](#1-introduction)
2. [Contexte et Objectifs](#2-contexte-et-objectifs)
3. [Spécifications Fonctionnelles](#3-spécifications-fonctionnelles)
4. [Fonctionnement par Rôle - Workflows Détaillés](#4-fonctionnement-par-rôle---workflows-détaillés)
5. [Spécifications Techniques](#5-spécifications-techniques)
6. [Architecture du Système](#6-architecture-du-système)
7. [Structure de la Base de Données](#7-structure-de-la-base-de-données)
8. [Description de l'Interface](#8-description-de-linterface)
9. [Sécurité et Authentification](#9-sécurité-et-authentification)
10. [Déploiement et Infrastructure](#10-déploiement-et-infrastructure)
11. [Développement et Maintenance](#11-développement-et-maintenance)

---

## 1. Introduction

### 1.1 Présentation du Projet

Le système Guardian Vision (Air Traffic Control) est une application web complète dédiée à la gestion des incidents techniques dans le domaine de la navigation aérienne. Le système permet de gérer deux types d'incidents distincts : les incidents matériels (hardware) et les incidents logiciels (software), avec un système de rapports intégré pour l'analyse des incidents logiciels.

### 1.2 Portée du Projet

Ce document décrit les spécifications fonctionnelles et techniques complètes du système, incluant :
- La gestion des utilisateurs et des rôles avec contrôle d'accès basé sur les rôles (RBAC)
- La gestion des incidents matériels et logiciels
- La gestion des équipements
- Le système de rapports d'analyse
- Les tableaux de bord et statistiques
- L'interface utilisateur moderne et responsive

---

## 2. Contexte et Objectifs

### 2.1 Contexte

L'Guardian nécessite un système centralisé pour :
- Enregistrer et suivre les incidents techniques (matériels et logiciels)
- Gérer les équipements de navigation aérienne
- Générer des rapports d'analyse d'incidents logiciels
- Fournir des statistiques et tableaux de bord pour la prise de décision
- Assurer la traçabilité des interventions
- Séparer les responsabilités par service (Maintenance vs Intégration)

### 2.2 Objectifs

**Objectifs Fonctionnels :**
- Centraliser la gestion des incidents techniques
- Séparer les responsabilités par type d'incident (matériel/logiciel)
- Fournir un historique complet des interventions
- Générer des rapports d'analyse structurés
- Offrir des statistiques en temps réel avec graphiques
- Permettre l'impression des formulaires et rapports

**Objectifs Techniques :**
- Application web moderne et responsive
- Architecture sécurisée avec authentification JWT
- Contrôle d'accès basé sur les rôles (RBAC)
- API RESTful pour l'intégration future
- Déploiement cloud scalable (Vercel + Render)

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
  - Accès en lecture aux incidents logiciels (pour créer des incidents depuis l'historique)
  - Création d'incidents logiciels depuis l'historique (bouton "Ajouter un incident software")

**2. Service Integration et Développement (`service_integration`)**
- **Accès :** Incidents logiciels uniquement
- **Permissions :**
  - CRUD complet sur les incidents logiciels
  - CRUD complet sur les rapports d'analyse
  - Consultation de l'historique des incidents logiciels
  - Accès au tableau de bord logiciel
  - Accès à la page Rapports

**3. Chef de Département (`chef_departement`)**
- **Accès :** Vue globale en lecture seule
- **Permissions :**
  - Consultation de tous les tableaux de bord (administrateur, matériel, logiciel)
  - Consultation de l'historique complet (matériel et logiciel) via onglets séparés
  - Lecture seule de tous les incidents et rapports
  - Accès aux statistiques globales
  - Pas de modification possible

**4. Super Admin (`superadmin`)**
- **Accès :** Accès complet au système
- **Permissions :**
  - Toutes les permissions des autres rôles
  - Gestion des utilisateurs (création, modification, suppression)
  - Accès à toutes les fonctionnalités administratives
  - Modification de tous les types d'incidents

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
  - Nom de l'équipement (liste déroulante avec recherche)
  - Partition
  - Numéro de série (recherche avec autocomplétion)
  - Description de l'incident (obligatoire)

- **Détails techniques :**
  - Anomalie observée
  - Action réalisée
  - Pièce de rechange utilisée
  - État de l'équipement après intervention
  - Recommandations

- **Métadonnées :**
  - Type de maintenance (Préventive/Corrective)
  - Durée d'arrêt (en minutes)
  - Lien vers l'équipement (optionnel, via numéro de série)
  - Date de création et de mise à jour

#### 3.2.2 Fonctionnalités

- Création, modification, suppression d'incidents
- Recherche et filtrage par équipement, partition, date
- Association avec les équipements (via numéro de série)
- Export et impression des données
- Historique complet des interventions
- Consultation de l'historique d'un équipement depuis le formulaire

### 3.3 Gestion des Incidents Logiciels

#### 3.3.1 Champs de l'Incident Logiciel

- **Informations de base :**
  - Date et heure de l'incident
  - Description (obligatoire)
  - Sujet
  - Commentaires

- **Contexte opérationnel :**
  - Serveur
  - Partition
  - Position (anciennement "Position STA")

- **Informations techniques :**
  - Type d'anomalie (Systématique/Aléatoire)
  - Call Sign (anciennement "Indicatif")
  - Nom du radar (dropdown : OS, MG, SD, LO, BY)
  - FL (Flight Level)
  - Longitude et Latitude
  - Code SSR

**Note :** Les champs "Simulateur" et "Salle opérationnelle" ont été retirés du formulaire.

#### 3.3.2 Fonctionnalités

- Création, modification, suppression d'incidents
- Recherche et filtrage avancé
- Génération de rapports d'analyse (formulaire intégré)
- Export et impression
- Historique complet
- Création de rapport directement depuis le formulaire d'incident

### 3.4 Gestion des Rapports

#### 3.4.1 Structure du Rapport

Chaque incident logiciel peut avoir un rapport d'analyse associé (relation 1:1) :

- **Date et heure du rapport** (utilise la date/heure de l'incident associé)
- **Anomalie :** Description détaillée de l'anomalie
- **Analyse :** Analyse technique approfondie
- **Conclusion :** Conclusions et recommandations

#### 3.4.2 Fonctionnalités

- Création et modification de rapports
- Association un-à-un avec les incidents logiciels
- Formulaire de rapport intégré dans le formulaire d'incident software
- Formulaire visible immédiatement sous le bouton "Enregistrer l'incident"
- Bouton séparé "Enregistrer le rapport" (actif uniquement après sauvegarde de l'incident)
- Impression des rapports (format paysage, sans en-têtes/footers)
- Page dédiée pour la gestion des rapports
- Recherche d'incident par ID, description ou serveur lors de la création

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
- Consultation de l'historique depuis le formulaire d'incident

### 3.6 Tableaux de Bord et Statistiques

#### 3.6.1 Tableau de Bord Administrateur (`/dashboard`)

**Statistiques affichées :**
- Nombre total d'incidents matériels et logiciels
- Incidents avec arrêt (matériel)
- Statistiques des 30 derniers jours
- Répartition par type de maintenance (Préventive/Corrective)

**Graphiques :**
- Incidents Matériels par équipement (avec filtres année/mois/semaine)
- Répartition du temps d'arrêt par équipement (avec filtres)
- Incidents Logiciels par serveur (avec filtres indépendants année/mois/semaine)
- Incidents logiciels par type d'anomalie (Systématique/Aléatoire uniquement)
- Évolution des incidents matériels (30 derniers jours)
- Incidents Correctifs par Année
- Incidents Correctifs par Serveur

**Filtres de période :**
- Sélection hiérarchique : Année → Mois (de l'année) → Semaine (du mois, max 4 semaines)
- Filtres indépendants pour le graphique "Incidents Logiciels par serveur"

#### 3.6.2 Tableau de Bord Matériel (`/dashboard/hardware`)

**Statistiques affichées :**
- Nombre total d'incidents matériels
- Incidents avec arrêt
- 30 derniers jours
- Répartition par type de maintenance
- Durée totale d'arrêt
- Durée moyenne d'arrêt

**Graphiques :**
- Évolution sur 30 jours
- Répartition par équipement
- Répartition par type de maintenance

#### 3.6.3 Tableau de Bord Logiciel (`/dashboard/software`)

**Statistiques affichées :**
- Nombre total d'incidents logiciels
- Répartition par type d'anomalie
- Nombre de rapports générés

**Graphiques :**
- Évolution sur 30 jours
- Répartition par serveur
- Répartition par type d'anomalie

---

## 4. Fonctionnement par Rôle - Workflows Détaillés

### 4.1 Service Maintenance (`service_maintenance`)

#### 4.1.1 Connexion et Accès

**Étape 1 : Connexion**
1. L'utilisateur accède à l'application
2. Redirection automatique vers `/login` si non authentifié
3. Saisie du username et password
4. Clic sur "Se connecter"
5. Backend valide les identifiants et génère les tokens JWT
6. Redirection vers la page principale selon les permissions

**Étape 2 : Navigation**
- Menu latéral affiche :
  - **Incidents Hardware** (`/hardware`)
  - **Incidents Software** (`/software`) - Accès en lecture + création depuis historique
  - **Équipements** (`/equipment`)
  - **Historique** (`/history`)

#### 4.1.2 Création d'un Incident Matériel

**Workflow complet :**

1. **Accès au formulaire**
   - Clic sur "Incidents Hardware" dans le menu
   - Le formulaire est affiché directement sur la page

2. **Remplissage du formulaire**
   - **Date et heure :** Sélection via date picker et time picker
   - **Nom de l'équipement :** 
     - Dropdown avec liste prédéfinie
     - Recherche par saisie
     - Sélection d'un équipement
   - **Numéro de série :**
     - Champ texte avec autocomplétion
     - Recherche dans la base d'équipements
     - Affichage dropdown avec résultats
     - Si équipement trouvé : lien automatique, bouton "Voir historique" apparaît
   - **Partition :** Champ texte
   - **Description :** Champ texte obligatoire
   - **Anomalie observée :** Champ texte
   - **Action réalisée :** Champ texte
   - **Pièce de rechange utilisée :** Champ texte
   - **État après intervention :** Champ texte
   - **Recommandations :** Champ texte
   - **Type de maintenance :** Dropdown (Préventive/Corrective)
   - **Durée d'arrêt :** Champ numérique (minutes)

3. **Consultation de l'historique d'un équipement**
   - Si numéro de série correspond à un équipement existant
   - Bouton "Voir historique" apparaît
   - Clic ouvre un dialogue avec l'historique des incidents de cet équipement
   - Affichage sous forme de tableau avec détails

4. **Soumission**
   - Clic sur "Enregistrer l'incident"
   - Validation côté client
   - Envoi POST à `/api/incidents/` avec `type=hardware`
   - Backend valide les permissions et les données
   - Sauvegarde en base de données
   - Message de succès affiché
   - Formulaire réinitialisé

5. **Modification d'un incident**
   - Depuis la page `/hardware`, clic sur "Modifier" dans le tableau
   - Redirection vers `/incident/edit/{id}`
   - Formulaire pré-rempli avec les données existantes
   - Modification des champs
   - Clic sur "Enregistrer"
   - Envoi PUT à `/api/incidents/{id}/`
   - Mise à jour en base de données

6. **Suppression d'un incident**
   - Clic sur "Supprimer" dans le tableau
   - Dialogue de confirmation
   - Confirmation → Envoi DELETE à `/api/incidents/{id}/`
   - Suppression en base de données
   - Rafraîchissement du tableau

#### 4.1.3 Gestion des Équipements

**Workflow :**

1. **Accès**
   - Clic sur "Équipements" dans le menu
   - Affichage de la liste des équipements

2. **Création d'un équipement**
   - Clic sur "Nouvel équipement"
   - Formulaire avec :
     - Numéro de série
     - Nom de l'équipement
     - Partition
     - État
   - Soumission → POST `/api/equipement/`

3. **Modification/Suppression**
   - Actions similaires aux incidents

#### 4.1.4 Consultation de l'Historique

**Workflow :**

1. **Accès**
   - Clic sur "Historique" dans le menu
   - Affichage avec onglets "Matériel" et "Logiciel"

2. **Filtrage**
   - Recherche textuelle
   - Filtrage par période
   - Tri par colonnes

3. **Actions**
   - Consultation des détails
   - Impression (pour matériel)
   - Pour logiciel : possibilité de créer un incident software depuis l'historique

#### 4.1.5 Création d'un Incident Logiciel depuis l'Historique

**Workflow :**

1. **Accès à l'historique logiciel**
   - Onglet "Logiciel" dans la page Historique
   - Affichage de la liste des incidents logiciels

2. **Création depuis l'historique**
   - Clic sur "Ajouter un incident software" (bouton visible uniquement pour service_maintenance)
   - Redirection vers `/software`
   - Formulaire d'incident logiciel affiché
   - Remplissage des champs
   - Enregistrement

**Note :** Le service maintenance peut créer des incidents logiciels mais ne peut pas créer de rapports.

### 4.2 Service Integration et Développement (`service_integration`)

#### 4.2.1 Connexion et Accès

**Navigation :**
- Menu latéral affiche :
  - **Incidents Software** (`/software`)
  - **Historique** (`/history`)
  - **Rapports** (`/reports`)

#### 4.2.2 Création d'un Incident Logiciel

**Workflow complet :**

1. **Accès au formulaire**
   - Clic sur "Incidents Software" dans le menu
   - Formulaire affiché directement

2. **Remplissage du formulaire**
   - **Date et heure :** Sélection
   - **Description :** Champ texte obligatoire
   - **Serveur :** Champ texte
   - **Partition :** Champ texte
   - **Position :** Champ texte
   - **Type d'anomalie :** Dropdown (Systématique/Aléatoire)
   - **Call Sign :** Champ texte
   - **Nom radar :** Dropdown (OS, MG, SD, LO, BY)
   - **FL :** Champ texte
   - **Longitude/Latitude :** Champs texte
   - **Code SSR :** Champ texte
   - **Sujet :** Champ texte
   - **Commentaires :** Champ texte

3. **Formulaire de rapport intégré**
   - **Visible immédiatement** sous le bouton "Enregistrer l'incident"
   - Formulaire avec 3 champs :
     - **Anomalie :** Description détaillée
     - **Analyse :** Analyse technique
     - **Conclusion :** Conclusions
   - **Bouton "Enregistrer le rapport"** :
     - Désactivé tant que l'incident n'est pas sauvegardé
     - Activé après sauvegarde réussie de l'incident
     - Soumission indépendante de l'incident

4. **Soumission de l'incident**
   - Clic sur "Enregistrer l'incident"
   - Validation
   - POST `/api/incidents/` avec `type=software`
   - Sauvegarde en base
   - Message de succès
   - L'ID de l'incident créé est stocké pour le rapport

5. **Soumission du rapport**
   - Après sauvegarde de l'incident, le bouton "Enregistrer le rapport" devient actif
   - Remplissage des champs du rapport (si souhaité)
   - Clic sur "Enregistrer le rapport"
   - POST `/api/reports/` avec `software_incident_id`
   - Sauvegarde du rapport
   - Message de succès

**Note :** Le rapport peut être créé immédiatement après l'incident ou plus tard depuis la page Rapports.

#### 4.2.3 Gestion des Rapports

**Workflow depuis la page Rapports (`/reports`) :**

1. **Accès**
   - Clic sur "Rapports" dans le menu
   - Affichage de la liste des rapports existants

2. **Création d'un nouveau rapport**
   - Clic sur "Nouveau rapport"
   - Dialogue de sélection d'incident :
     - Champ de recherche avec autocomplétion
     - Recherche par ID, description ou serveur
     - Affichage dropdown avec résultats
     - Sélection d'un incident
   - Clic sur "Créer"
   - Redirection vers `/software/report/{id}`
   - Formulaire de rapport pré-rempli avec date/heure de l'incident
   - Remplissage des champs
   - Enregistrement

3. **Modification d'un rapport**
   - Clic sur "Modifier" dans la liste
   - Redirection vers `/software/report/{id}`
   - Modification des champs
   - Enregistrement

4. **Consultation**
   - Clic sur "Voir" dans la liste
   - Affichage du rapport complet
   - Possibilité d'impression

5. **Impression**
   - Format paysage (horizontal)
   - Sans en-têtes/footers du navigateur
   - Titre : "Rapport d'Analyse d'Incident Logiciel"
   - Date et heure : celles de l'incident (pas du rapport)
   - Texte introductif : "J'ai l'honneur de vous faire parvenir ci-dessous les résultats des investigations..."
   - Contenu : Anomalie, Analyse, Conclusion

#### 4.2.4 Consultation de l'Historique

- Accès via "Historique" dans le menu
- Onglet "Logiciel" affiché par défaut
- Filtrage et recherche
- Impression des rapports depuis l'historique

### 4.3 Chef de Département (`chef_departement`)

#### 4.3.1 Connexion et Accès

**Navigation :**
- Menu latéral affiche :
  - **Tableau de bord** (`/`)
  - **Historique Hardware** (`/history/hardware`)
  - **Historique Software** (`/history/software`)
  - **Rapports** (`/reports`) - Lecture seule

**Note :** Le chef de département voit des onglets séparés pour l'historique au lieu d'un seul onglet.

#### 4.3.2 Consultation des Tableaux de Bord

**Workflow :**

1. **Tableau de bord principal (`/`)**
   - Vue consolidée matériel + logiciel
   - Statistiques globales
   - Graphiques de tendances
   - Filtres par période (année/mois/semaine)
   - **Tous les boutons de modification sont désactivés/masqués**

2. **Tableau de bord matériel (`/dashboard/hardware`)**
   - Statistiques matérielles uniquement
   - Graphiques matériels
   - Accès en lecture seule

3. **Tableau de bord logiciel (`/dashboard/software`)**
   - Statistiques logicielles uniquement
   - Graphiques logiciels
   - Accès en lecture seule

#### 4.3.3 Consultation de l'Historique

**Workflow :**

1. **Historique Hardware**
   - Clic sur "Historique Hardware"
   - Affichage de tous les incidents matériels
   - Filtrage et recherche
   - Consultation des détails
   - Impression possible
   - **Pas de modification possible**

2. **Historique Software**
   - Clic sur "Historique Software"
   - Affichage de tous les incidents logiciels
   - Filtrage et recherche
   - Consultation des détails et rapports
   - Impression possible
   - **Pas de modification possible**

#### 4.3.4 Consultation des Rapports

- Accès via "Rapports" dans le menu
- Liste de tous les rapports
- Consultation en lecture seule
- Impression possible
- **Pas de création/modification possible**

### 4.4 Super Admin (`superadmin`)

#### 4.4.1 Connexion et Accès

**Navigation :**
- Menu latéral affiche :
  - **Tableau de bord** (`/`)
  - **Incidents Hardware** (`/hardware`)
  - **Incidents Software** (`/software`)
  - **Équipements** (`/equipment`)
  - **Historique** (`/history`)
  - **Rapports** (`/reports`)
  - **Gestion Utilisateurs** (`/users`) - **Uniquement pour superadmin**

#### 4.4.2 Gestion des Utilisateurs

**Workflow complet :**

1. **Accès**
   - Clic sur "Gestion Utilisateurs" dans le menu
   - Affichage de la liste de tous les utilisateurs

2. **Création d'un utilisateur**
   - Clic sur "Nouvel utilisateur"
   - Formulaire avec :
     - Username (unique)
     - Password (minimum 8 caractères)
     - Rôle (dropdown : service_maintenance, service_integration, chef_departement, superadmin)
     - Email (optionnel)
   - Soumission → POST `/api/users/`
   - Création en base de données

3. **Modification d'un utilisateur**
   - Clic sur "Modifier" dans la liste
   - Formulaire pré-rempli
   - Modification des champs (username, rôle, email)
   - Changement de mot de passe (champ séparé)
   - Soumission → PUT `/api/users/{id}/`

4. **Suppression d'un utilisateur**
   - Clic sur "Supprimer"
   - Dialogue de confirmation
   - Confirmation → DELETE `/api/users/{id}/`
   - **Note :** Impossible de supprimer son propre compte

#### 4.4.3 Accès Complet

Le superadmin a accès à **toutes** les fonctionnalités :
- CRUD complet sur tous les types d'incidents
- CRUD complet sur les équipements
- CRUD complet sur les rapports
- Gestion des utilisateurs
- Accès à tous les tableaux de bord
- Consultation de tout l'historique

---

## 5. Spécifications Techniques

### 5.1 Stack Technologique

#### 5.1.1 Frontend

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

#### 5.1.2 Backend

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

#### 5.1.3 Infrastructure

**Déploiement :**
- **Render.com** - Hébergement backend et base de données
- **Vercel** - Hébergement frontend

**Outils de Développement :**
- **Git** - Contrôle de version
- **ESLint** - Linter JavaScript/TypeScript
- **PostgreSQL 16+** - Base de données

### 5.2 Architecture du Système

#### 5.2.1 Architecture Générale

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

#### 5.2.2 Architecture Frontend

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

#### 5.2.3 Architecture Backend

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
├── core/
│   ├── settings.py        # Configuration Django
│   └── urls.py            # URLs principales
└── manage.py
```

---

## 6. Architecture du Système

### 6.1 Modèle de Données

Le système utilise une architecture relationnelle avec les entités suivantes :

- **User** - Utilisateurs du système avec rôles
- **Equipement** - Équipements matériels
- **HardwareIncident** - Incidents matériels
- **SoftwareIncident** - Incidents logiciels
- **Report** - Rapports d'analyse (liés aux incidents logiciels, relation 1:1)

### 6.2 Flux de Données

**Authentification :**
1. Utilisateur saisit identifiants
2. Backend valide et génère JWT tokens (access + refresh)
3. Frontend stocke tokens dans localStorage
4. Access token inclus dans header `Authorization` de chaque requête
5. Refresh automatique des tokens expirés

**Gestion des Incidents :**
1. Utilisateur crée/modifie un incident via le formulaire
2. Frontend valide les données côté client
3. Frontend envoie requête POST/PUT à l'API
4. Backend valide les permissions (RBAC)
5. Backend valide les données
6. Données sauvegardées en base de données
7. Frontend met à jour l'affichage (cache TanStack Query)

---

## 7. Structure de la Base de Données

### 7.1 Schéma Relationnel

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
│  │ server           │  │
│  │ partition        │  │
│  │ position         │  │
│  │ type_anomalie    │  │
│  │ call_sign        │  │
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

### 7.2 Tables Détaillées

#### 7.2.1 Table `users`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| username | VARCHAR(150) | UNIQUE, NOT NULL | Nom d'utilisateur |
| password | VARCHAR(128) | NOT NULL | Mot de passe hashé (PBKDF2) |
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

#### 7.2.2 Table `equipement`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| num_serie | VARCHAR(255) | NULL | Numéro de série |
| nom_equipement | VARCHAR(255) | NOT NULL | Nom de l'équipement |
| partition | VARCHAR(255) | NOT NULL | Partition |
| etat | VARCHAR(50) | DEFAULT 'actuel' | État de l'équipement |
| created_at | TIMESTAMP | DEFAULT NOW() | Date de création |
| updated_at | TIMESTAMP | AUTO UPDATE | Date de mise à jour |

#### 7.2.3 Table `hardware_incidents`

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

#### 7.2.4 Table `software_incidents`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Identifiant unique |
| date | DATE | NOT NULL | Date de l'incident |
| time | TIME | NOT NULL | Heure de l'incident |
| server | VARCHAR(255) | NULL | Serveur |
| partition | VARCHAR(255) | NULL | Partition |
| position | VARCHAR(255) | NULL | Position |
| type_d_anomalie | VARCHAR(255) | NULL | Type d'anomalie |
| call_sign | VARCHAR(255) | NULL | Call Sign |
| nom_radar | VARCHAR(10) | NULL | Nom du radar (OS, MG, SD, LO, BY) |
| FL | VARCHAR(255) | NULL | Flight Level |
| longitude | VARCHAR(255) | NULL | Longitude |
| latitude | VARCHAR(255) | NULL | Latitude |
| code_SSR | VARCHAR(255) | NULL | Code SSR |
| sujet | VARCHAR(255) | NULL | Sujet |
| description | TEXT | NOT NULL | Description |
| commentaires | TEXT | NULL | Commentaires |
| created_at | TIMESTAMP | DEFAULT NOW() | Date création |
| updated_at | TIMESTAMP | AUTO UPDATE | Date mise à jour |

#### 7.2.5 Table `reports`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Identifiant unique |
| software_incident_id | INTEGER | UNIQUE, FK → software_incidents.id | Incident associé |
| date | DATE | NOT NULL | Date du rapport (utilise date incident) |
| time | TIME | NOT NULL | Heure du rapport (utilise time incident) |
| anomaly | TEXT | NOT NULL | Description anomalie |
| analysis | TEXT | NOT NULL | Analyse technique |
| conclusion | TEXT | NOT NULL | Conclusion |
| created_at | TIMESTAMP | DEFAULT NOW() | Date création |
| updated_at | TIMESTAMP | AUTO UPDATE | Date mise à jour |

**Relation :** Un rapport est associé à un seul incident logiciel (relation 1:1)

### 7.3 Index et Contraintes

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

## 8. Description de l'Interface

### 8.1 Architecture de l'Interface

L'interface suit une architecture moderne avec :
- **Layout responsive** - Adapté mobile, tablette et desktop
- **Navigation latérale** - Menu sidebar avec icônes, adaptatif selon les permissions
- **Header** - Barre supérieure avec informations utilisateur et déconnexion
- **Zone de contenu principale** - Affichage dynamique selon la route

### 8.2 Structure Globale de l'Application

#### 8.2.1 Layout Principal

L'application utilise un layout fixe avec trois zones principales :

**1. Sidebar (Navigation Latérale)**
- **Position :** Fixe à gauche de l'écran
- **Largeur :** 256px (w-64)
- **Hauteur :** Pleine hauteur de l'écran (h-screen)
- **Fond :** Couleur de thème `sidebar` avec bordure droite
- **Contenu :**
  - **En-tête :** Logo Guardian (image `/guardian.png`) dans un carré blanc arrondi, texte "Guardian Vision" en gras
  - **Navigation :** Liste de liens avec icônes Lucide React
    - Chaque élément de menu :
      - Icône à gauche (h-5 w-5)
      - Texte du menu
      - Style actif : fond `sidebar-primary` avec ombre
      - Style inactif : texte `sidebar-foreground` avec hover `sidebar-accent`
  - **Pied de page :** Texte centré "Système de Gestion des Incidents" en petit
- **Adaptatif :** Les éléments de menu sont masqués selon les permissions de l'utilisateur

**2. Navbar (Barre de Navigation Supérieure)**
- **Position :** Fixe en haut, à droite de la sidebar
- **Hauteur :** 64px (h-16)
- **Largeur :** De la sidebar jusqu'au bord droit
- **Fond :** Couleur `card` avec bordure inférieure
- **Contenu :**
  - **Gauche :** Titre "Système de Gestion des Incidents" (text-xl, font-semibold)
  - **Droite :**
    - Badge utilisateur avec icône User et nom d'utilisateur
    - Bouton "Déconnexion" avec icône LogOut (visible sur desktop, texte masqué sur mobile)

**3. Zone de Contenu Principal**
- **Position :** Marges gauche (ml-64) et haut (pt-16) pour éviter sidebar et navbar
- **Padding :** 24px (p-6) sur tous les côtés
- **Fond :** Couleur `background` du thème
- **Contenu :** Pages dynamiques selon la route

### 8.3 Description Détaillée de Chaque Écran

#### 8.3.1 Écran de Connexion (`/login`)

**URL :** `/login`  
**Accès :** Public (redirection automatique si non authentifié)

**Description Visuelle :**
- **Fond :** Image de fond `/guardianbg.jpg` avec overlay sombre (linear-gradient noir 50% opacité)
- **Centrage :** Contenu centré verticalement et horizontalement
- **Carte de connexion :**
  - **Style :** Carte avec backdrop-blur et fond semi-transparent (`bg-card/95`)
  - **Largeur maximale :** 448px (max-w-md)
  - **Ombre :** shadow-2xl
  - **Contenu :**
    - **En-tête :**
      - Logo Guardian dans un carré blanc arrondi (h-24 w-24, bg-white/95)
      - Titre "Guardian Vision" (text-4xl, font-bold, couleur primary)
      - Sous-titre "Système de Gestion des Incidents" (text-lg, font-medium, blanc 90% opacité)
    - **Formulaire :**
      - **Champ Username :**
        - Label "Nom d'utilisateur"
        - Input texte avec placeholder "Entrez votre nom d'utilisateur"
        - Validation : requis
      - **Champ Password :**
        - Label "Mot de passe"
        - Input password avec placeholder "Entrez votre mot de passe"
        - Validation : requis
      - **Bouton "Se connecter" :**
        - Largeur pleine (w-full)
        - État de chargement : "Connexion..." pendant la requête
        - Désactivé pendant le chargement
    - **Pied de page :** Texte "Accès réservé au personnel autorisé" (text-sm, muted)

**Comportement :**
- Validation côté client avant soumission
- Gestion des erreurs :
  - Compte verrouillé : affichage du temps restant
  - Identifiants invalides : message d'erreur
  - Erreur serveur : message générique
- Redirection automatique vers la page principale après connexion réussie
- Redirection automatique si déjà authentifié

#### 8.3.2 Tableau de Bord Administrateur (`/` ou `/dashboard`)

**URL :** `/`  
**Accès :** Chef de Département, Super Admin

**Description Visuelle :**

**En-tête de Page :**
- Titre "Tableau de bord" (text-3xl, font-bold)
- Description "Vue d'ensemble complète des incidents techniques et statistiques" (text-muted-foreground)

**Section Incidents Matériels :**
- **Sous-titre :** "Incidents Matériels" avec icône Cpu (h-6 w-6)
- **Cartes Statistiques (Grid 2x2 sur desktop, 1 colonne sur mobile) :**
  - **Carte 1 :** "Total Incidents Matériels"
    - Valeur : Nombre total d'incidents matériels filtrés
    - Icône : Cpu
    - Variante : accent
    - Trend : "Uniquement maintenance corrective" si année passée
  - **Carte 2 :** "Incidents avec arrêt"
    - Valeur : Nombre d'incidents avec durée d'arrêt > 0
    - Icône : AlertTriangle
    - Variante : primary
    - Trend : Pourcentage des incidents
- **Cartes Secondaires (Grid 3 colonnes) :**
  - **Carte 3 :** "30 derniers jours"
    - Valeur : Nombre d'incidents des 30 derniers jours
    - Icône : Calendar
  - **Carte 4 :** "Maintenance Préventive" (si année actuelle)
    - Valeur : Nombre d'incidents préventifs
    - Icône : TrendingUp
    - Trend : Pourcentage
  - **Carte 5 :** "Maintenance Corrective"
    - Valeur : Nombre d'incidents correctifs
    - Icône : AlertTriangle
    - Variante : warning
    - Trend : Pourcentage

**Section Incidents Logiciels :**
- **Sous-titre :** "Incidents Logiciels" avec icône HardDrive (h-6 w-6)
- **Carte Statistique :**
  - **Carte :** "Total Incidents Logiciels"
    - Valeur : Nombre total d'incidents logiciels filtrés
    - Icône : HardDrive
    - Variante : warning

**Section Filtres de Période :**
- **Carte :** "Période d'analyse"
  - **En-tête :** Titre avec icône Calendar
  - **Contenu :**
    - **Sélecteur Année :**
      - Label "Année:"
      - Dropdown Select avec toutes les années disponibles
      - Format : "2025 (actuelle)" pour l'année courante
      - Largeur : 150px
    - **Sélecteur Mois :**
      - Label "Mois:"
      - Dropdown Select avec "Tous les mois" + 12 mois
      - Noms des mois en français (janvier, février, etc.)
      - Largeur : 150px
    - **Sélecteur Semaine :** (visible uniquement si mois sélectionné)
      - Label "Semaine:"
      - Dropdown Select avec "Toutes les semaines" + Semaines 1-4
      - Largeur : 150px
    - **Note :** (si année passée) "Note: Pour les années précédentes, seuls les incidents de maintenance corrective sont affichés pour les incidents matériels."

**Graphiques :**

1. **Carte "Incidents Matériels par équipement" :**
   - **Titre :** "Incidents Matériels par équipement" + période sélectionnée
   - **Graphique :** BarChart vertical (Recharts)
     - Axe Y : Noms d'équipements (width: 300px, interval: 0)
     - Axe X : Nombre d'incidents
     - Hauteur dynamique : `Math.max(450, data.length * 40)`
     - Barres bleues (#3b82f6) avec coins arrondis

2. **Carte "Répartition du temps d'arrêt par équipement" :**
   - **Titre :** "Répartition du temps d'arrêt par équipement" + période
   - **Graphique :** BarChart vertical (Recharts)
     - Axe Y : Noms d'équipements
     - Axe X : Minutes (label "Minutes")
     - Tooltip : Format "Xh Ymin"
     - Barres rouges (#ef4444)
     - Message si aucune donnée : "Aucun temps d'arrêt enregistré pour la période sélectionnée"

3. **Carte "Incidents Logiciels par serveur" :**
   - **Titre :** "Incidents Logiciels par serveur" + période
   - **Filtres indépendants dans l'en-tête :**
     - Sélecteurs Année, Mois, Semaine (même style que filtres principaux)
   - **Graphique :** BarChart vertical (Recharts)
     - Axe Y : Noms de serveurs
     - Axe X : Nombre d'incidents
     - Barres orange (#f59e0b)
     - Hauteur dynamique

4. **Carte "Évolution des incidents matériels (30 derniers jours)" :**
   - **Titre :** "Évolution des incidents matériels (30 derniers jours)"
   - **Graphique :** LineChart (Recharts)
     - Axe X : Jours (format "17 déc", angle -45°)
     - Axe Y : Nombre d'incidents
     - Ligne bleue (#3b82f6) avec points
     - Hauteur : 300px

5. **Carte "Incidents logiciels par type d'anomalie" :**
   - **Titre :** "Incidents logiciels par type d'anomalie" + période
   - **Graphique :** BarChart empilé (Recharts)
     - Axe X : Périodes (angle -45°, height: 80px)
     - Axe Y : Nombre d'incidents
     - Barres empilées : Systématique et Aléatoire
     - Couleurs : Bleu et Orange
     - Hauteur : 400px
   - **Résumé :** Grille de cartes avec totaux par type d'anomalie

6. **Carte "Incidents Correctifs par Année" :**
   - **Titre :** "Incidents Correctifs par Année"
   - **Graphique :** BarChart horizontal (Recharts)
     - Axe X : Années
     - Axe Y : Nombre d'incidents
     - Barres rouges (#ef4444)
     - Hauteur : 350px

7. **Carte "Incidents Correctifs par Serveur" :**
   - **Titre :** "Incidents Correctifs par Serveur"
   - **Graphique :** BarChart vertical (Recharts)
     - Axe Y : Serveurs (width: 150px)
     - Axe X : Nombre d'incidents
     - Barres rouges (#ef4444)
     - Hauteur : 350px

**Sections Statistiques :**
- **Carte "Statistiques Matériel - Répartition par Serveur" :**
  - Grille 2 colonnes avec top 6 serveurs
  - Chaque carte : Nombre (text-lg, font-bold) + Nom serveur (text-xs, muted)

- **Carte "Statistiques Logiciel - Répartition par Serveur" :**
  - Même format que matériel

#### 8.3.3 Page Incidents Matériels (`/hardware`)

**URL :** `/hardware`  
**Accès :** Service Maintenance, Chef de Département, Super Admin

**Description Visuelle :**

**En-tête de Page :**
- Titre "Gestion des Incidents Hardware" (text-3xl, font-bold)
- Description "Enregistrer et suivre les incidents liés au matériel (Hardware)" (text-muted-foreground)

**Formulaire de Création :**
- **Composant :** `IncidentForm` avec `type="hardware"`
- **Titre :** "Nouveau incident hardware"
- **Champs :**
  - **Date :** Date picker (obligatoire)
  - **Heure :** Time picker (obligatoire)
  - **Nom de l'équipement :** Select avec recherche
    - Liste prédéfinie d'équipements (ALER Serveur..., ALER ROUTEUR..., ALER SWITCH..., etc.)
    - Recherche par saisie
    - Sélection dans dropdown
  - **Numéro de série :** Input texte avec autocomplétion
    - Recherche dans la base d'équipements
    - Dropdown avec résultats
    - Si équipement trouvé : bouton "Voir historique" apparaît
  - **Partition :** Input texte
  - **Description :** Textarea (obligatoire)
  - **Anomalie observée :** Textarea
  - **Action réalisée :** Textarea
  - **Pièce de rechange utilisée :** Textarea
  - **État après intervention :** Textarea
  - **Recommandations :** Textarea
  - **Type de maintenance :** Select (Préventive/Corrective)
  - **Durée d'arrêt :** Input nombre (minutes)
- **Bouton :** "Enregistrer l'incident" (primary, largeur pleine)

**Dialogue Historique Équipement :**
- **Déclencheur :** Bouton "Voir historique" (si équipement trouvé)
- **Contenu :**
  - Titre : "Historique de l'équipement"
  - Tableau avec colonnes :
    - Date
    - Heure
    - Description
    - Type de maintenance
    - Durée d'arrêt
  - Bouton "Fermer"

**Tableau des Incidents :**
- **Composant :** `IncidentTable`
- **Colonnes :**
  - Date
  - Heure
  - Équipement
  - Partition
  - Numéro de série
  - Description (tronquée)
  - Type de maintenance
  - Durée d'arrêt
  - Actions (Modifier, Supprimer)
- **Actions :**
  - **Modifier :** Icône Edit, redirection vers `/incident/edit/{id}`
  - **Supprimer :** Icône Trash2, dialogue de confirmation
- **Fonctionnalités :**
  - Tri par colonnes
  - Recherche textuelle
  - Impression (bouton Imprimer)

**Message si Lecture Seule :**
- (Pour Chef de Département) : "Accès en lecture seule. Vous ne pouvez pas créer de nouveaux incidents matériels."

#### 8.3.4 Page Incidents Logiciels (`/software`)

**URL :** `/software`  
**Accès :** Service Integration, Service Maintenance (création depuis historique), Chef de Département, Super Admin

**Description Visuelle :**

**En-tête de Page :**
- Titre "Gestion des Incidents Software" (text-3xl, font-bold)
- Description "Enregistrer et suivre les incidents liés aux logiciels (Software)" (text-muted-foreground)

**Formulaire de Création :**
- **Composant :** `IncidentForm` avec `type="software"`
- **Titre :** "Nouveau incident software"
- **Champs Incident :**
  - **Date :** Date picker (obligatoire)
  - **Heure :** Time picker (obligatoire)
  - **Description :** Textarea (obligatoire)
  - **Serveur :** Input texte
  - **Partition :** Input texte
  - **Position :** Input texte
  - **Type d'anomalie :** Select (Systématique/Aléatoire)
  - **Call Sign :** Input texte
  - **Nom radar :** Select (OS, MG, SD, LO, BY)
  - **FL :** Input texte
  - **Longitude :** Input texte
  - **Latitude :** Input texte
  - **Code SSR :** Input texte
  - **Sujet :** Input texte
  - **Commentaires :** Textarea
- **Bouton :** "Enregistrer l'incident" (primary, largeur pleine)

**Formulaire de Rapport (Intégré) :**
- **Position :** Immédiatement sous le bouton "Enregistrer l'incident"
- **Titre :** "Rapport d'analyse"
- **Champs :**
  - **Anomalie :** Textarea (description détaillée)
  - **Analyse :** Textarea (analyse technique)
  - **Conclusion :** Textarea (conclusions)
- **Bouton :** "Enregistrer le rapport"
  - **État initial :** Désactivé (disabled)
  - **État après sauvegarde incident :** Activé
  - **Style :** Secondary, largeur pleine

**Tableau des Incidents :**
- Même structure que page Hardware
- Colonnes adaptées :
  - Date
  - Heure
  - Serveur
  - Partition
  - Type d'anomalie
  - Description (tronquée)
  - Actions (Modifier, Supprimer, Ajouter Rapport)

**Message si Lecture Seule :**
- (Pour Chef de Département) : "Accès en lecture seule. Vous ne pouvez pas créer de nouveaux incidents logiciels."

#### 8.3.5 Page Édition d'Incident (`/incident/edit/:id`)

**URL :** `/incident/edit/{id}`  
**Accès :** Utilisateurs avec permissions de modification

**Description Visuelle :**

**En-tête de Page :**
- Titre "Modifier l'incident" (text-3xl, font-bold)
- Badge indiquant le type (Hardware/Software)

**Formulaire :**
- **Composant :** `IncidentForm` avec `initialData` pré-rempli
- Même structure que formulaire de création
- Tous les champs pré-remplis avec les données existantes
- **Bouton :** "Enregistrer les modifications" (primary)

**Navigation :**
- Bouton "Retour" vers la page précédente

#### 8.3.6 Page Historique (`/history`)

**URL :** `/history`  
**Accès :** Tous les utilisateurs authentifiés (selon permissions)

**Description Visuelle :**

**En-tête de Page :**
- Titre "Historique" (text-3xl, font-bold)
- Description "Consulter l'ensemble des incidents enregistrés" (text-muted-foreground)

**Onglets :**
- **TabsList :** Grid 2 colonnes (ou 1 si un seul type accessible)
- **Onglet Hardware :**
  - Icône Cpu
  - Texte "Incidents Matériels ({count})"
- **Onglet Software :**
  - Icône HardDrive
  - Texte "Incidents Logiciels ({count})"

**Contenu Onglet Hardware :**
- **Carte Filtres :**
  - Titre "Filtres de recherche - Matériel"
  - **Champ Recherche :**
    - Input avec icône Search à gauche
    - Placeholder : "Rechercher par description, équipement, numéro de série, partition..."
    - Recherche en temps réel
- **Carte Tableau :**
  - Titre "Incidents Matériels ({count})"
  - **Composant :** `IncidentTable` avec incidents filtrés
  - Colonnes complètes
  - Actions : Modifier, Supprimer, Imprimer

**Contenu Onglet Software :**
- **Carte Filtres :**
  - Titre "Filtres de recherche - Logiciel"
  - **Champ Recherche :**
    - Input avec icône Search
    - Placeholder : "Rechercher par description, sujet, serveur, type d'anomalie..."
- **Carte Tableau :**
  - Titre "Incidents Logiciels ({count})"
  - **Composant :** `IncidentTable` avec incidents filtrés
  - Colonnes adaptées
  - Actions : Modifier, Supprimer, Imprimer, Voir Rapport
- **Bouton spécial (Service Maintenance) :**
  - "Ajouter un incident software" (visible uniquement pour service_maintenance)
  - Redirection vers `/software`

#### 8.3.7 Page Historique Hardware (`/history/hardware`)

**URL :** `/history/hardware`  
**Accès :** Service Maintenance, Chef de Département, Super Admin

**Description Visuelle :**
- Même structure que l'onglet Hardware de `/history`
- Page dédiée (utilisée par Chef de Département qui voit des onglets séparés dans le menu)

#### 8.3.8 Page Historique Software (`/history/software`)

**URL :** `/history/software`  
**Accès :** Service Integration, Chef de Département, Super Admin

**Description Visuelle :**
- Même structure que l'onglet Software de `/history`
- Page dédiée (utilisée par Chef de Département)

#### 8.3.9 Page Équipements (`/equipment`)

**URL :** `/equipment`  
**Accès :** Service Maintenance, Chef de Département, Super Admin

**Description Visuelle :**

**En-tête de Page :**
- Titre "Gestion des Équipements" (text-3xl, font-bold)
- Description "Gérer les équipements matériels" (text-muted-foreground)

**Formulaire de Création/Modification :**
- **Carte :** "Nouvel équipement" ou "Modifier l'équipement"
- **Champs :**
  - **Numéro de série :** Input texte
  - **Nom de l'équipement :** Select avec liste prédéfinie (même liste que formulaire incident)
  - **Partition :** Select (ALER par défaut)
  - **État :** Select (actuel/hors service/etc.)
- **Boutons :**
  - "Enregistrer" (primary)
  - "Annuler" (si édition)

**Tableau des Équipements :**
- **Colonnes :**
  - Numéro de série
  - Nom de l'équipement
  - Partition
  - État
  - Date de création
  - Actions (Modifier, Supprimer, Voir historique)
- **Action Historique :**
  - Icône History
  - Ouvre dialogue avec historique des incidents de l'équipement

**Dialogue Historique :**
- Titre "Historique de l'équipement {nom}"
- Tableau avec incidents associés
- Colonnes : Date, Heure, Description, Type maintenance, Durée arrêt

#### 8.3.10 Page Rapports (`/reports`)

**URL :** `/reports`  
**Accès :** Service Integration, Chef de Département, Super Admin

**Description Visuelle :**

**En-tête de Page :**
- Titre "Gestion des Rapports" (text-3xl, font-bold)
- Description "Gérer les rapports d'analyse des incidents logiciels" (text-muted-foreground)

**Bouton Création :**
- "Nouveau rapport" (primary, icône Plus)
- Ouvre dialogue de sélection d'incident

**Dialogue Sélection Incident :**
- **Titre :** "Sélectionner un incident"
- **Champ Recherche :**
  - Input avec autocomplétion
  - Recherche par ID, description ou serveur
  - Dropdown avec résultats filtrés
  - Affichage : ID, Description, Serveur
- **Boutons :**
  - "Créer" (si incident sélectionné)
  - "Annuler"

**Carte Filtres :**
- **Champ Recherche :**
  - Input avec icône Search
  - Placeholder : "Rechercher par ID, description, serveur..."
  - Recherche dans : anomaly, analysis, conclusion, incident ID

**Tableau des Rapports :**
- **Colonnes :**
  - ID Incident
  - Date
  - Heure
  - Anomalie (tronquée)
  - Actions (Voir, Modifier, Supprimer)
- **Actions :**
  - **Voir :** Redirection vers `/software/report/{id}`
  - **Modifier :** Redirection vers `/software/report/{id}` (mode édition)
  - **Supprimer :** Dialogue de confirmation

#### 8.3.11 Page Création/Édition Rapport (`/software/report/:id`)

**URL :** `/software/report/{id}`  
**Accès :** Service Integration, Super Admin

**Description Visuelle :**

**En-tête de Page :**
- Titre "Rapport d'analyse" (text-3xl, font-bold)
- Sous-titre avec ID de l'incident

**Informations Incident (Lecture Seule) :**
- **Carte :** Affichage des informations de l'incident associé
- Champs : Date, Heure, Serveur, Description, etc.

**Formulaire Rapport :**
- **Champs :**
  - **Date :** Pré-remplie avec date de l'incident (lecture seule)
  - **Heure :** Pré-remplie avec heure de l'incident (lecture seule)
  - **Anomalie :** Textarea (obligatoire)
  - **Analyse :** Textarea (obligatoire)
  - **Conclusion :** Textarea (obligatoire)
- **Boutons :**
  - "Enregistrer le rapport" (primary)
  - "Annuler" (retour à la page précédente)
  - "Imprimer" (si rapport existant)

**Mode Impression :**
- Format paysage (horizontal)
- Sans en-têtes/footers navigateur
- Titre : "Rapport d'Analyse d'Incident Logiciel"
- En-tête : DE/DS/SID (date/heure incident)
- Texte introductif : "J'ai l'honneur de vous faire parvenir ci-dessous les résultats des investigations..."
- Sections : Anomalie, Analyse, Conclusion

#### 8.3.12 Page Gestion Utilisateurs (`/users`)

**URL :** `/users`  
**Accès :** Super Admin uniquement

**Description Visuelle :**

**En-tête de Page :**
- Titre "Gestion des Utilisateurs" (text-3xl, font-bold)
- Description "Créer et gérer les comptes utilisateurs" (text-muted-foreground)

**Bouton Création :**
- "Nouvel utilisateur" (primary, icône Plus)
- Ouvre dialogue de création

**Dialogue Création/Modification :**
- **Titre :** "Nouvel utilisateur" ou "Modifier l'utilisateur"
- **Champs :**
  - **Username :** Input texte (obligatoire, unique)
  - **Password :** Input password (obligatoire pour création, optionnel pour modification)
  - **Rôle :** Select avec options :
    - Service Maintenance
    - Service Integration et Développement
    - Chef de Département
    - Super Admin
- **Boutons :**
  - "Enregistrer" (primary)
  - "Annuler"

**Tableau des Utilisateurs :**
- **Colonnes :**
  - Username
  - Rôle (badge coloré)
  - Date de création
  - État (Actif/Inactif)
  - Actions (Modifier, Supprimer)
- **Action Supprimer :**
  - Dialogue de confirmation
  - Impossible de supprimer son propre compte

#### 8.3.13 Page Tableau de Bord Matériel (`/dashboard/hardware`)

**URL :** `/dashboard/hardware`  
**Accès :** Chef de Département, Super Admin

**Description Visuelle :**
- Structure similaire à la section "Incidents Matériels" du tableau de bord administrateur
- Statistiques matérielles uniquement
- Graphiques matériels
- Liste des incidents récents

#### 8.3.14 Page Tableau de Bord Logiciel (`/dashboard/software`)

**URL :** `/dashboard/software`  
**Accès :** Chef de Département, Super Admin

**Description Visuelle :**
- Structure similaire à la section "Incidents Logiciels" du tableau de bord administrateur
- Statistiques logicielles uniquement
- Graphiques logiciels
- Liste des incidents récents

#### 8.3.15 Page 404 - Non Trouvée (`/*`)

**URL :** Toute route non définie  
**Accès :** Public

**Description Visuelle :**
- **Centrage :** Vertical et horizontal
- **Contenu :**
  - Titre "404" (text-6xl, font-bold)
  - Message "Page non trouvée"
  - Description "La page que vous recherchez n'existe pas."
  - Bouton "Retour à l'accueil" (primary)

### 8.4 Pages Principales (Résumé)

#### 8.2.1 Page de Connexion (`/login`)

**Éléments :**
- Formulaire de connexion centré
- Champs : Username, Password
- Bouton de connexion
- Gestion des erreurs :
  - Compte verrouillé (affichage du temps restant)
  - Identifiants invalides
  - Erreur serveur
- Design moderne avec fond dégradé
- Redirection automatique si déjà authentifié

#### 8.2.2 Tableaux de Bord

**Tableau de Bord Administrateur (`/dashboard` ou `/`)**
- Vue consolidée matériel + logiciel
- Statistiques globales avec cartes
- Graphiques de tendances (Recharts)
- Filtres par période (année/mois/semaine)
- Liste des incidents récents
- Graphiques :
  - Incidents Matériels par équipement
  - Répartition temps d'arrêt par équipement
  - Incidents Logiciels par serveur (avec filtres indépendants)
  - Incidents logiciels par type d'anomalie (Systématique/Aléatoire)
  - Évolution 30 derniers jours
  - Incidents Correctifs par Année
  - Incidents Correctifs par Serveur

**Tableau de Bord Matériel (`/dashboard/hardware`)**
- Statistiques matérielles uniquement
- Graphiques matériels
- Incidents récents

**Tableau de Bord Logiciel (`/dashboard/software`)**
- Statistiques logicielles uniquement
- Graphiques logiciels
- Incidents récents

#### 8.2.3 Gestion des Incidents

**Page Incidents Matériels (`/hardware`)**
- Formulaire de création en haut de page
- Tableau listant tous les incidents (si permissions)
- Actions : Créer, Modifier, Supprimer
- Recherche et filtrage
- Export/Impression
- Consultation historique équipement depuis formulaire

**Page Incidents Logiciels (`/software`)**
- Formulaire de création en haut de page
- Formulaire de rapport intégré sous le formulaire d'incident
- Tableau listant tous les incidents (si permissions)
- Actions : Créer, Modifier, Supprimer, Ajouter Rapport
- Recherche et filtrage
- Export/Impression

#### 8.2.4 Historique

**Page Historique (`/history`)**
- Onglets séparés Matériel/Logiciel
- Filtrage par période
- Recherche textuelle
- Affichage détaillé de chaque incident
- Impression des rapports (logiciels)
- Pour service_maintenance : bouton "Ajouter un incident software"

**Pages Historique Séparées (Chef de Département) :**
- `/history/hardware` - Historique matériel uniquement
- `/history/software` - Historique logiciel uniquement

#### 8.2.5 Gestion des Équipements (`/equipment`)

- Liste de tous les équipements
- Formulaire de création/modification
- Actions : Créer, Modifier, Supprimer
- Recherche par nom, numéro de série, partition
- Association avec incidents matériels
- Consultation historique depuis formulaire d'incident

#### 8.2.6 Gestion des Rapports (`/reports`)

- Liste de tous les rapports
- Recherche par ID incident, description, serveur
- Actions : Créer, Modifier, Voir, Supprimer
- Dialogue de sélection d'incident avec recherche
- Impression des rapports

#### 8.2.7 Gestion des Utilisateurs (`/users`) - Super Admin uniquement

- Liste de tous les utilisateurs
- Formulaire de création/modification
- Actions : Créer, Modifier, Supprimer
- Attribution de rôles
- Gestion des permissions
- Changement de mot de passe

### 8.3 Composants Réutilisables

#### 8.3.1 IncidentForm

Formulaire dynamique pour créer/modifier les incidents :
- Validation côté client
- Champs conditionnels selon le type (hardware/software)
- Gestion des erreurs
- Soumission asynchrone
- Intégration formulaire rapport (pour software)
- Autocomplétion numéro de série (hardware)
- Consultation historique équipement

#### 8.3.2 IncidentTable

Tableau réutilisable pour afficher les incidents :
- Colonnes configurables
- Tri et filtrage
- Actions contextuelles (Modifier, Supprimer)
- Mode impression optimisé
- Pagination (si nécessaire)

#### 8.3.3 Sidebar

Navigation latérale :
- Menu adaptatif selon les permissions
- Icônes pour chaque section
- Indicateur de page active
- Masquage automatique des sections non autorisées
- Différent pour chef_departement (onglets séparés historique)

#### 8.3.4 StatCard

Carte de statistique :
- Valeur principale
- Label descriptif
- Icône optionnelle
- Variation (augmentation/diminution)
- Design moderne avec ombres

### 8.4 Design System

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

### 8.5 Formats d'Impression

#### 8.5.1 Impression Incidents Matériels

- Titre : "Fiche Intervention Technique"
- En-tête : DE/DS/SMS (au lieu de date/heure)
- Contenu complet de l'incident
- Format portrait

#### 8.5.2 Impression Incidents Logiciels

- Titre : "Formulaire de description d'anomalie"
- En-tête : DE/DS/SID (au lieu de date/heure)
- Contenu complet de l'incident
- Format portrait

#### 8.5.3 Impression Rapports

- Titre : "Rapport d'Analyse d'Incident Logiciel"
- En-tête : DE/DS/SID (date/heure de l'incident, pas du rapport)
- **Sans** "Établissement National de la Navigation Aérienne (Guardian)"
- **Sans** "Document généré le..."
- Texte introductif : "J'ai l'honneur de vous faire parvenir ci-dessous les résultats des investigations..."
- Contenu : Anomalie, Analyse, Conclusion
- Format **paysage (horizontal)**
- Sans en-têtes/footers du navigateur

---

## 9. Sécurité et Authentification

### 9.1 Authentification JWT

**Flux d'authentification :**
1. Utilisateur saisit identifiants
2. Backend valide et génère :
   - Access Token (durée : 1 heure)
   - Refresh Token (durée : 7 jours)
3. Tokens stockés dans localStorage
4. Access Token inclus dans header `Authorization: Bearer <token>` de chaque requête
5. Refresh automatique si access token expiré

**Sécurité des tokens :**
- Rotation des refresh tokens
- Blacklist lors de la déconnexion
- Validation côté serveur à chaque requête
- Expiration automatique

### 9.2 Contrôle d'Accès (RBAC)

**Implémentation :**
- Permissions définies par rôle dans le backend (`api/permissions.py`)
- Vérification côté serveur à chaque requête
- Masquage des fonctionnalités côté client selon les permissions (`usePermissions.ts`)
- Routes protégées avec composant `ProtectedRoute`

**Matrice de Permissions :**

| Fonctionnalité | Maintenance | Integration | Chef Dep | Superadmin |
|----------------|-------------|-------------|----------|------------|
| Incidents Matériels - Lecture | ✅ | ❌ | ✅ | ✅ |
| Incidents Matériels - Écriture | ✅ | ❌ | ❌ | ✅ |
| Incidents Logiciels - Lecture | ✅* | ✅ | ✅ | ✅ |
| Incidents Logiciels - Écriture | ✅** | ✅ | ❌ | ✅ |
| Équipements - Lecture | ✅ | ❌ | ✅ | ✅ |
| Équipements - Écriture | ✅ | ❌ | ❌ | ✅ |
| Rapports - Lecture | ❌ | ✅ | ✅ | ✅ |
| Rapports - Écriture | ❌ | ✅ | ❌ | ✅ |
| Utilisateurs - Gestion | ❌ | ❌ | ❌ | ✅ |
| Tableaux de Bord | Matériel | Logiciel | Tous | Tous |

*Service Maintenance peut lire les incidents logiciels pour créer depuis l'historique  
**Service Maintenance peut créer des incidents logiciels depuis l'historique mais pas de rapports

### 9.3 Protection des Données

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

## 10. Déploiement et Infrastructure

### 10.1 Architecture de Déploiement

**Environnement de Production :**

```
┌─────────────────────────────────────┐
│         Vercel (Frontend)           │
│  https://guardian-atc-...vercel.app     │
│  - Build automatique                │
│  - CDN global                       │
│  - HTTPS automatique                │
└──────────────┬──────────────────────┘
               │ HTTPS
               │ API Calls
               ▼
┌─────────────────────────────────────┐
│      Render.com (Backend)           │
│  https://guardian-atc-...onrender.com  │
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

### 10.2 Configuration de Déploiement

#### 10.2.1 Frontend (Vercel)

**Variables d'environnement :**
- `VITE_API_BASE_URL` - URL de l'API backend

**Build :**
- Framework : Vite
- Build command : `npm run build`
- Output directory : `dist`

#### 10.2.2 Backend (Render)

**Variables d'environnement :**
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` - Connexion DB
- `SECRET_KEY` - Clé secrète Django
- `DEBUG` - Mode debug (False en production)
- `ALLOWED_HOSTS` - Domaines autorisés
- `RENDER` - Indicateur d'environnement Render

**Build :**
- Build command : `./setup_django.sh`
- Start command : `./start_render.sh`

### 10.3 Processus de Déploiement

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

### 10.4 Monitoring et Logs

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

## 11. Développement et Maintenance

### 11.1 Environnement de Développement

#### 11.1.1 Prérequis

**Frontend :**
- Node.js 18+
- npm ou yarn
- Git

**Backend :**
- Python 3.11+
- PostgreSQL 16+
- pip

#### 11.1.2 Installation Locale

**1. Cloner le dépôt :**
```bash
git clone <repository-url>
cd Guardian
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

### 11.2 Structure du Code

#### 11.2.1 Organisation Frontend

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

#### 11.2.2 Organisation Backend

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
├── core/
│   ├── settings.py    # Configuration
│   └── urls.py        # URLs principales
└── manage.py          # CLI Django
```

### 11.3 API Endpoints

#### 11.3.1 Authentification

```
POST   /api/auth/login/          # Connexion
POST   /api/auth/logout/         # Déconnexion
POST   /api/auth/refresh/        # Rafraîchir token
GET    /api/auth/profile/        # Profil utilisateur
```

#### 11.3.2 Incidents

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

#### 11.3.3 Équipements

```
GET    /api/equipement/                   # Liste équipements
POST   /api/equipement/                   # Créer équipement
GET    /api/equipement/{id}/              # Détails équipement
PUT    /api/equipement/{id}/              # Modifier équipement
DELETE /api/equipement/{id}/              # Supprimer équipement
```

#### 11.3.4 Rapports

```
GET    /api/reports/                      # Liste rapports
POST   /api/reports/                      # Créer rapport
GET    /api/reports/{id}/                 # Détails rapport
PUT    /api/reports/{id}/                 # Modifier rapport
DELETE /api/reports/{id}/                 # Supprimer rapport
```

#### 11.3.5 Utilisateurs (Super Admin uniquement)

```
GET    /api/users/                        # Liste utilisateurs
POST   /api/users/                        # Créer utilisateur
GET    /api/users/{id}/                   # Détails utilisateur
PUT    /api/users/{id}/                   # Modifier utilisateur
DELETE /api/users/{id}/                   # Supprimer utilisateur
```

### 11.4 Tests et Qualité

**Tests Frontend :**
- TypeScript strict
- Validation des formulaires
- Tests E2E (à implémenter)

**Tests Backend :**
- Tests unitaires des modèles (à implémenter)
- Tests des vues API (à implémenter)
- Tests des permissions (à implémenter)
- Tests d'intégration (à implémenter)

**Qualité du Code :**
- ESLint pour le code JavaScript/TypeScript
- Formatage automatique
- Validation TypeScript stricte
- Code review avant merge

### 11.5 Maintenance

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

---

## 12. Utilisateurs par Défaut

### 12.1 Comptes de Test

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

## 13. Conclusion

Ce cahier des charges décrit un système complet de gestion des incidents techniques pour l'Guardian, avec :

- **Architecture moderne** : React + Django REST API
- **Sécurité renforcée** : JWT, RBAC, protection des données
- **Interface intuitive** : Design moderne et responsive
- **Scalabilité** : Déploiement cloud avec auto-scaling
- **Maintenabilité** : Code structuré et documenté
- **Séparation des responsabilités** : Rôles distincts pour chaque service
- **Traçabilité complète** : Historique et rapports détaillés

Le système répond aux besoins fonctionnels et techniques requis pour une gestion efficace des incidents techniques dans le domaine de la navigation aérienne.

---

**Document préparé par :** Équipe de Développement Guardian Vision  
**Date de dernière mise à jour :** Décembre 2025  
**Version du document :** 1.0.0
