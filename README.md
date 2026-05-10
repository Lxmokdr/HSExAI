# Guardian Vision — Industrial Safety Intelligence Platform

![Guardian Vision](https://img.shields.io/badge/Guardian-Vision-blue?style=for-the-badge&logo=ai)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-orange?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge)
![Django](https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge)

**Guardian Vision** is an enterprise-grade, AI-powered industrial safety monitoring system. It leverages computer vision (YOLOv8) to automate PPE compliance tracking, identify workplace hazards, and provide real-time risk intelligence for complex industrial environments.

## 🛡️ Hybrid Safety Intelligence Features

### 👁️ Real-time Neural Vision
- **Advanced PPE Detection**: High-precision YOLOv8 inference for Helmets and Shoes.
- **Neural Color Heuristics**: Custom HSV-based algorithms for detecting **Safety Vests** (Orange/Yellow) and **Gloves** (Hi-Vis) on personnel.
- **Dual-Pane Analysis Suite**: Cinematic inspection interface for per-person safety compliance audits.
- **Dynamic Risk Scoring**: Real-time severity calculation (LOW to CRITICAL) based on active violation patterns.

### 🧠 Predictive & Operational Intelligence
- **Operations Dashboard**: Restored command center for legacy incident management and asset tracking.
- **Predictive ML Module**: Early warning system for equipment failure risks using Random Forest classifiers.
- **Compliance Velocity**: Deep analytics of adherence trends to identify systemic workplace safety gaps.

### 📍 Sector Command & Control
- **Per-Zone Safety Rules**: Fine-grained PPE requirements (e.g., "Goggles required in Zone A").
- **Smart Thresholds**: Automated alerts triggered when zone compliance drops below configured targets.
- **Live Monitoring Control**: Toggle real-time vision processing on/off per operational sector.

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts |
| **Backend** | Django 5.0, Django REST Framework, PostgreSQL |
| **AI/ML** | YOLOv8 (Ultralytics), OpenCV, NumPy, PIL |
| **Auth** | JWT (JSON Web Tokens) with Role-Based Access Control (RBAC) |
| **DevOps** | Vite, Shell Scripting, Pipenv |

## 🚀 Getting Started

### Prerequisites
- **Python 3.12+**
- **Node.js 18+**
- **PostgreSQL 16**

### Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Lxmokdr/ENNA-ATC---Gestion-des-Incidents.git
   cd Guardian-Vision
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py create_default_users
   ```

3. **Frontend Setup**:
   ```bash
   cd ..
   npm install
   ```

4. **Launch Application**:
   ```bash
   ./start.sh
   ```

## 🔧 AI API Endpoints (v3.0)

### Detection & Analysis
```http
POST   /api/ai/detect/image/          # Run YOLOv8 analysis on uploaded frame
GET    /api/ai/events/                # List all historical detection events
GET    /api/ai/events/:id/           # Detailed analysis of a specific event
```

### Analytics & Insights
```http
GET    /api/ai/analytics/compliance/  # Fetch overall compliance trends
GET    /api/ai/analytics/zones/       # Fetch risk distribution per zone
GET    /api/ai/insights/              # Get AI-generated safety insights
```

### Zone Configuration
```http
GET    /api/ai/zones/                 # List all monitored zones
POST   /api/ai/zones/                 # Create new safety zone with PPE rules
PUT    /api/ai/zones/:id/             # Update zone requirements/thresholds
```

## 📝 Project Architecture
```
.
├── backend/
│   ├── ai_engine/          # Core Vision Intelligence (Services, Models, Views)
│   ├── api/                # Legacy Incident Management API
│   ├── core/               # Django Settings & Core Config
│   └── media/              # Storage for Original & Annotated Frames
├── src/
│   ├── pages/              # Dashboards, Vision Suite, Zone Management
│   ├── services/           # API Client with AI extensions
│   ├── components/         # Premium UI Components (Shadcn/Lucide)
│   └── hooks/              # Auth & Permission management
└── README.md
```

## 🛡️ Security & Privacy
- **Rebranded from ENNA**: All corporate identifiers removed for privacy compliance.
- **Local AI Processing**: Inference can be run locally or via private cloud infrastructure.
- **RBAC**: Strict access controls ensuring only authorized safety officers can modify zone rules.

---
© 2026 **Guardian Vision** · *Intelligent Safety for the Modern Industry.*
# HSExAI
