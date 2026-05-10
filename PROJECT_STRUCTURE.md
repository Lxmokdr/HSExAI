# Structure du Projet Guardian Vision

**Version:** 3.0.0  
**Date:** Mai 2026  
**Projet:** Industrial Safety Intelligence Platform — Guardian Vision

---

## Vue d'Ensemble

Guardian Vision est une plateforme d'intelligence visuelle industrielle de classe entreprise. L'architecture est divisée en un moteur d'inférence AI robuste (Django + YOLOv8) et une suite d'interfaces de commandement cinématiques (React + Framer Motion).

```
Guardian-Vision/
├── backend/                    # Backend Django REST Framework + AI Engine
├── src/                        # Frontend React TypeScript + Tailwind + Motion
├── public/                     # Assets statiques & Media
├── docs/                       # Documentation technique & Schémas
├── weights/                    # Modèles YOLOv8 pré-entraînés
├── package.json               # Dépendances (incluant framer-motion, recharts)
└── start.sh                    # Script de démarrage unifié (Dev & Demo)
```

---

## Backend Architecture (`backend/`)

### Modular Vision Engine

```
backend/
├── ai_engine/                  # Cœur de l'Intelligence Artificielle
│   ├── services/               # Logique métier & Algorithmes
│   │   ├── detection_service.py # Pipeline d'inférence YOLOv8
│   │   ├── compliance_service.py # Évaluation des règles PPE/EPI
│   │   ├── risk_engine.py      # Calculateur de score de risque (0-100)
│   │   ├── analytics_service.py # Executive KPIs & Compliance Trends
│   │   └── image_annotation.py # Service de dessin sur frames
│   ├── models.py              # Zone, DetectionEvent, SafetyViolation
│   ├── views.py               # Endpoints REST pour Dashboards & Alerts
│   └── urls.py                # Routing v3.0 (/api/ai/*)
│
├── api/                        # Application de Maintenance (Legacy Support)
│   ├── models.py              # User, Equipement, HardwareIncident, etc.
│   └── views.py               # CRUD Maintenance classique
│
├── core/                       # Paramètres & Configuration Globale
├── media/                      # Stockage des images Originales & Analyse
└── weights/                    # Fichiers de poids YOLOv8 (.pt)
```

---

## Frontend Architecture (`src/`)

### Cinematic UI Architecture

```
src/
├── components/                # Système de Composants Premium
│   ├── ai/                   # Flagship Dashboard Widgets
│   │   ├── DashboardWidgets.tsx # StatCards, RiskBadges
│   │   ├── InsightWidgets.tsx   # ComplianceGauge, AIInsightCard
│   │   ├── TimelineWidgets.tsx  # DetectionTimeline
│   │   └── SystemWidgets.tsx    # AlertCard, AIProcessingLoader
│   ├── ui/                   # Base UI (Shadcn/ui)
│   └── Layout.tsx            # Structure avec Grid Background
│
├── pages/                     # Interfaces de Commandement
│   ├── ExecutiveDashboard.tsx # Flagship High-Level Vision Dashboard
│   ├── DetectionAnalysis.tsx  # Neural Inspection Suite (Dual-pane)
│   ├── AIAlertCenter.tsx      # Real-time Safety Monitoring Console
│   ├── ZoneOverview.tsx       # Sector Management & Threshold Config
│   ├── AIAnalyticsDashboard.tsx # Statistical Compliance Trends
│   ├── Violations.tsx         # Detailed Safety Incident Logs
│   ├── AdminDashboard.tsx     # Operations Analytics & Predictive ML
│   ├── Equipment.tsx          # Industrial Asset Inventory
│   ├── Login.tsx              # Neural-themed Auth Interface
│   └── ...                    # Hardware/Software Incident Modules
│
├── services/                  # Communications Centralisées
│   └── api.ts                # Client API Unified (AI + Operations)
│
├── App.tsx                    # Command Routing & Logic
└── index.css                  # Design System (Dark Industrial Force)
```

### Stack Technologique v3.0
- **Animations:** Framer Motion (Transitions fluides, Micro-interactions)
- **Data Viz:** Recharts (Graphiques interactifs premium)
- **Styling:** Vanilla CSS + Tailwind (Design Glassmorphism)

---

**Dernière mise à jour :** Mai 2026  
**Équipe :** Guardian Vision AI Solutions  
**Version du Document :** 3.0.0
