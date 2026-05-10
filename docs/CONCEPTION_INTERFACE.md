# Conception de l'interface utilisateur

## 1. Maquettes (wireframes) des principales pages

### 1.1 Page de connexion

**Structure générale :**
- Layout plein écran avec image de fond (guardianbg.jpg) et overlay sombre
- Centrage vertical et horizontal de la carte de connexion
- Carte flottante avec effet de flou (backdrop-blur) et transparence

**Composants principaux :**
- **Header visuel :** Logo Guardian (guardian.png) dans un conteneur blanc arrondi (24x24), titre "Guardian Vision" en gras, sous-titre "Système de Gestion des Incidents"
- **Formulaire de connexion :**
  - Champ "Nom d'utilisateur" avec placeholder
  - Champ "Mot de passe" (masqué) avec placeholder
  - Bouton "Se connecter" pleine largeur avec état de chargement ("Connexion...")
- **Message informatif :** "Accès réservé au personnel autorisé" en bas du formulaire

**Caractéristiques visuelles :**
- Fond avec image de fond et overlay pour lisibilité
- Carte avec ombre portée importante (shadow-2xl)
- Design moderne avec bordures arrondies (rounded-xl)
- Focus sur la simplicité et la clarté

---

### 1.2 Tableau de bord / Page d'accueil

**Structure générale :**
- Layout avec sidebar fixe à gauche (256px) et navbar fixe en haut
- Zone de contenu principal avec padding (margin-left: 256px, padding-top: 64px)
- En-tête de section avec titre (text-3xl) et description

**Section statistiques principales :**
- Grille responsive 4 colonnes (md:grid-cols-2 lg:grid-cols-4)
- **Cartes de statistiques (StatCard) :**
  - Total des incidents (icône AlertTriangle, variant primary)
  - Incidents Matériels (icône Cpu, variant accent)
  - Incidents Logiciels (icône HardDrive, variant warning)
  - Temps d'arrêt matériel (icône AlertTriangle, variant warning)
  - Chaque carte affiche : titre, valeur (text-3xl), icône dans badge coloré, trend optionnel

**Graphiques et répartitions :**
- Grille 2 colonnes pour les cartes secondaires
  - **Répartition par type :** Barres de progression pour Matériel/Logiciel avec pourcentages
  - **Temps d'arrêt :** Affichage du total et moyenne par incident

**Incidents récents :**
- Liste des 8 derniers incidents avec :
  - ID de l'incident
  - Type (Matériel/Logiciel)
  - Description
  - Localisation et date/heure
  - Effet hover pour meilleure interactivité

**Composants de navigation :**
- **Sidebar fixe (gauche, 256px) :**
  - Logo Guardian avec texte "Guardian Vision"
  - Menu de navigation vertical :
    * Tableau de bord (icône Home)
    * Incidents Hardware (icône Cpu)
    * Incidents Software (icône HardDrive)
    * Historique Global (icône History)
  - Indicateur visuel pour la page active (fond coloré)
  - Footer avec texte "Système de Gestion des Incidents"

- **Navbar fixe (haut, 64px) :**
  - Titre "Système de Gestion des Incidents"
  - Affichage du nom d'utilisateur avec icône User
  - Bouton de déconnexion (icône LogOut)

---

### 1.3 Formulaire de saisie d'incidents

**Structure générale :**
- Carte (Card) avec header et contenu
- Titre dynamique : "Ajouter un incident" ou "Modifier un incident"
- Formulaire organisé en sections logiques

**Champs communs (hardware et software) :**
- Grille 2 colonnes pour date et heure
  - Date : champ date avec valeur par défaut (date du jour)
  - Heure (GMT) : champ time avec valeur par défaut (heure actuelle)

**Champs spécifiques Hardware :**
- **Section Équipement :**
  - Nom de l'équipement (requis, placeholder exemple)
  - Partition (optionnel)
  - Numéro de série (optionnel)

- **Section Description :**
  - Description (textarea, requis)

- **Section Intervention :**
  - Anomalie observée (textarea optionnel)
  - Action réalisée (textarea optionnel)
  - Pièce de rechange utilisée (optionnel)
  - État de l'équipement après intervention (textarea optionnel)
  - Recommandation (textarea optionnel)

**Champs spécifiques Software :**
- **Section Configuration :**
  - Simulateur : Dropdown Yes/No
  - Salle opérationnelle : Dropdown Yes/No
  - Game (texte optionnel)
  - Partition : Dropdown (CCR/ALAP)
  - Group (texte optionnel)
  - Exercice (texte optionnel)
  - Secteur (texte optionnel)

- **Section Position :**
  - Position STA (texte optionnel)
  - Position logique (texte optionnel)

- **Section Anomalie :**
  - Type d'anomalie : Dropdown (Système/Aléatoire)
  - Indicatif (texte optionnel)
  - Mode radar : Sélection en 2 étapes
    * Catégorie : Normal/Mono/Bypass
    * Mode spécifique : Norm/OS/MJ/SD/LO
  - FL (ou altitude) (texte optionnel)

- **Section Coordonnées :**
  - Grille 2 colonnes pour Longitude/Latitude
  - Code SSR (texte optionnel)

- **Section Description :**
  - Sujet (texte optionnel)
  - Description (textarea requis, 4 lignes)
  - Commentaires (textarea optionnel, 3 lignes)

**Bouton de soumission :**
- Bouton pleine largeur "Enregistrer l'incident"
- État de chargement pendant la soumission
- Notifications toast pour succès/erreur

**Organisation visuelle :**
- Espacement cohérent (space-y-4 entre sections)
- Groupes de champs en grille 2 colonnes où pertinent
- Labels clairs et descriptifs
- Placeholders informatifs pour guider l'utilisateur

---

### 1.4 Historique / Recherche

**Structure générale :**
- En-tête avec titre "Historique Global" et description
- Section filtres dans une carte dédiée
- Tableau des résultats dans une carte séparée

**Section filtres :**
- Grille responsive 3 colonnes (md:grid-cols-3) :
  - **Recherche textuelle :**
    * Icône de recherche à gauche du champ
    * Placeholder "Rechercher..."
    * Recherche dans : description, nom d'équipement, sujet
  - **Type d'incident :** Dropdown
    * Tous les types
    * Matériel
    * Logiciel

**Tableau des incidents :**
- Utilise le composant IncidentTable
- En-tête affichant le nombre total d'incidents filtrés
- Colonnes affichées :
  - ID
  - Date
  - Heure
  - Type (Badge coloré)
  - Équipement/Sujet (selon le type)
  - Description (tronquée)
  - Actions (Icônes : Voir, Éditer, Supprimer, Imprimer)

**Fonctionnalités :**
- Filtrage en temps réel
- Tri par défaut (plus récents en premier)
- Pagination optionnelle si nécessaire
- Export/impression des résultats

**Actions disponibles sur chaque ligne :**
- Bouton "Voir" (icône FileText) : Affiche les détails complets
- Bouton "Éditer" (icône Edit) : Ouvre le formulaire de modification
- Bouton "Supprimer" (icône Trash2) : Confirmation avant suppression
- Bouton "Imprimer" (icône Printer) : Ouvre la vue d'impression

---

### 1.5 Tableau de bord de statistiques

**Vue pour Chef de Service (AdminDashboard) :**

**Indicateurs clés :**
- 4 cartes de statistiques principales :
  * Total des incidents (avec tendance)
  * Incidents Matériels
  * Incidents Logiciels
  * Temps d'arrêt matériel (format heures:minutes)

**Visualisations :**
- **Répartition par type :**
  * Barres de progression horizontales
  * Pourcentages et nombres d'incidents
  * Couleurs distinctes par type

- **Temps d'arrêt matériel :**
  * Affichage du total
  * Calcul de la moyenne par incident
  * Message si aucun temps d'arrêt

**Incidents récents :**
- Liste des 8 incidents les plus récents
- Affichage condensé avec :
  * ID, type, description
  * Localisation et date/heure
- Effet hover pour meilleure lisibilité

**Section catégories (dynamique) :**
- Liste des catégories existantes avec :
  * Nom de la catégorie
  * Nombre d'incidents
  * Barre de progression du pourcentage
- Masquage des catégories vides

---

## 2. Choix ergonomiques

### 2.1 Simplicité

**Principes appliqués :**
- **Navigation intuitive :** Menu latéral fixe avec icônes et labels clairs
- **Actions minimisées :** Un seul clic pour accéder aux principales fonctionnalités
- **Formulaires progressifs :** Affichage conditionnel des champs selon le type d'incident
- **Messages clairs :** Validation en temps réel avec messages d'erreur explicites
- **Workflow linéaire :** Parcours utilisateur simple : Créer → Consulter → Modifier

**Réduction de la complexité :**
- Pas de multi-étapes complexes : formulaire unique par type d'incident
- Valeurs par défaut intelligentes (date/heure actuelles)
- Auto-complétion pour certains champs (date, time depuis l'incident pour les rapports)
- Groupement logique des champs en sections

---

### 2.2 Clarté

**Hiérarchie visuelle :**
- **Typographie structurée :**
  * Titres de section : text-3xl, font-bold
  * Sous-titres : text-muted-foreground
  * Labels : font-medium
  * Valeurs : font-bold pour les chiffres importants

**Système de couleurs cohérent :**
- **Primary (bleu) :** Actions principales, liens actifs, sidebar
- **Accent (orange) :** Éléments importants, indicateurs
- **Success (vert) :** Confirmations, états positifs
- **Warning (jaune) :** Alertes, incidents logiciels
- **Destructive (rouge) :** Actions de suppression, erreurs
- **Muted (gris) :** Textes secondaires, bordures

**Feedback visuel :**
- États de boutons : hover, active, disabled
- Indicateurs de chargement : spinner ou texte "Connexion..."
- Notifications toast : succès (vert) et erreurs (rouge)
- Confirmation pour actions destructives (dialogue modal)
- Animation douce sur les transitions (hover effects)

**Labels et descriptions :**
- Labels explicites pour tous les champs
- Placeholders informatifs avec exemples
- Messages d'aide contextuelle
- Tooltips optionnels pour les éléments complexes

---

### 2.3 Responsivité

**Approche mobile-first :**
- Framework Tailwind CSS avec breakpoints standards :
  * `sm:` ≥ 640px
  * `md:` ≥ 768px
  * `lg:` ≥ 1024px
  * `xl:` ≥ 1280px

**Adaptations responsive :**

**Navigation :**
- Sidebar fixe sur desktop (256px)
- Sur mobile/tablette : sidebar repliable ou menu hamburger (à implémenter)
- Navbar toujours visible avec adaptation du texte (masquage optionnel sur petits écrans)

**Grilles :**
- Cartes de statistiques : 1 colonne (mobile) → 2 colonnes (tablette) → 4 colonnes (desktop)
- Formulaires : 1 colonne (mobile) → 2 colonnes (desktop) pour champs jumelés
- Tableaux : Scroll horizontal sur petits écrans avec en-têtes fixes

**Composants adaptatifs :**
- Boutons : texte complet sur desktop, icône seule sur mobile si espace limité
- Tableaux : Mode carte sur mobile (stack vertical) ou scroll horizontal
- Modales : Plein écran sur mobile, centrées sur desktop

**Images et médias :**
- Images responsives avec object-fit
- Logo adaptatif selon la taille d'écran
- Fond d'écran avec background-size: cover

**Accessibilité :**
- Touch targets ≥ 44px sur mobile
- Contraste de couleurs respectant WCAG AA
- Navigation au clavier fonctionnelle
- Focus visible sur les éléments interactifs

---

### 2.4 Accessibilité et expérience utilisateur

**Améliorations UX supplémentaires :**

**Performance :**
- Chargement progressif des données
- Skeleton loaders pendant le chargement
- Cache côté client avec React Query
- Optimisation des requêtes API

**Prévention des erreurs :**
- Validation côté client avant soumission
- Champ requis clairement indiqués (astérisque)
- Messages d'erreur contextuels près des champs
- Confirmation pour actions destructives

**Efficacité :**
- Raccourcis clavier optionnels
- Auto-sauvegarde de brouillons (à implémenter)
- Historique de modifications visible
- Recherche en temps réel

**Satisfaction utilisateur :**
- Design moderne et professionnel
- Animations subtiles et fluides
- Feedback immédiat sur toutes les actions
- Personnalisation possible (thème clair/sombre selon besoins)

---

## 3. Technologies d'interface utilisateur

### 3.1 Bibliothèques UI

- **Radix UI :** Composants accessibles et sans style (Dialog, Select, Toast, etc.)
- **Tailwind CSS :** Utility-first CSS pour un design cohérent et responsive
- **Lucide React :** Bibliothèque d'icônes moderne et légère
- **Sonner :** Système de notifications toast élégant

### 3.2 Architecture des composants

**Structure modulaire :**
- Composants réutilisables (Button, Card, Input, etc.)
- Composants métier spécialisés (IncidentForm, IncidentTable, StatCard)
- Layout partagé (Sidebar, Navbar, Layout)
- Pages spécifiques (Login, Dashboard, History, etc.)

**Séparation des responsabilités :**
- Composants UI purs (présentation)
- Hooks personnalisés (logique métier : useAuth, useIncidents)
- Services API (communication backend : api.ts)
- Pages (orchestration des composants)

---

## Conclusion

L'interface utilisateur de Guardian Vision a été conçue en suivant les principes de simplicité, clarté et responsivité. Chaque page offre une expérience utilisateur optimale avec une navigation intuitive, des formulaires clairs, et un feedback visuel immédiat. Le design moderne et professionnel s'adapte parfaitement aux différentes tailles d'écran tout en maintenant une cohérence visuelle globale.

