# Test Data and Equipment History Feature

## ✅ What's Been Added

### 1. Test Data Command
A management command to populate the database with sample data for testing the dashboard.

### 2. Equipment History Feature
- New API endpoint: `GET /api/equipement/<id>/history/`
- Frontend: History button on Equipment page
- Shows all hardware incidents related to a specific equipment

## 🚀 How to Use

### Create Test Data

Run this command to populate the database with test data:

```bash
cd /home/lxmix/data/Guardian/backend

# Create test data
sudo -E -u postgres env \
    PATH="/home/lxmix/data/anaconda3/bin:$PATH" \
    PYTHONPATH="/home/lxmix/.local/lib/python3.13/site-packages:/home/lxmix/data/anaconda3/lib/python3.13/site-packages" \
    /home/lxmix/data/anaconda3/bin/python3.13 manage.py create_test_data

# Or clear existing data and create fresh
sudo -E -u postgres env \
    PATH="/home/lxmix/data/anaconda3/bin:$PATH" \
    PYTHONPATH="/home/lxmix/.local/lib/python3.13/site-packages:/home/lxmix/data/anaconda3/lib/python3.13/site-packages" \
    /home/lxmix/data/anaconda3/bin/python3.13 manage.py create_test_data --clear
```

### What Test Data is Created

- **5 Equipment items** with different serial numbers
- **15 Hardware incidents** linked to equipment (various dates over last 60 days)
- **12 Software incidents** (various dates over last 45 days)
- **5 Reports** for software incidents

### View Equipment History

1. Go to the **Equipment** page in the frontend
2. Click the **History icon** (📜) button next to any equipment
3. A dialog will show all incidents related to that equipment

## 📡 API Endpoint

### Get Equipment History

**Endpoint:** `GET /api/equipement/<equipment_id>/history/`

**Response:**
```json
{
  "equipment": {
    "id": 1,
    "num_serie": "EQ-001",
    "nom_equipement": "Radar Principal",
    "partition": "Secteur A",
    "etat": "actuel",
    "created_at": "2024-11-17T...",
    "updated_at": "2024-11-17T..."
  },
  "incidents": [
    {
      "id": 1,
      "incident_type": "hardware",
      "date": "2024-11-15",
      "time": "14:30:00",
      "description": "...",
      ...
    }
  ],
  "count": 3
}
```

## 🎯 Features

- **Test Data**: Realistic sample data for dashboard testing
- **Equipment History**: View all incidents for a specific equipment
- **Filtering**: History shows incidents by equipment ID or serial number
- **UI Integration**: History button in Equipment table with modal dialog

## 📝 Notes

- Test data includes realistic French descriptions
- Incidents are distributed over the last 30-60 days
- Equipment serial numbers follow pattern: EQ-001, EQ-002, etc.
- History includes both incidents linked by `equipement_id` and by `numero_de_serie`

