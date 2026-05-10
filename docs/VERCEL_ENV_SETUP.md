# Vercel Environment Variables Setup

## Problem
If you see the error: "Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur http://localhost:8000"

This means the frontend is trying to connect to localhost instead of the Render backend.

## Solution

### Option 1: Set Environment Variable in Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://guardian-atc-gestion-des-incidents.onrender.com/api`
   - **Environment**: Production, Preview, Development (select all)
4. **Redeploy** your application for the changes to take effect

### Option 2: Use vercel.json (Current Setup)

The `vercel.json` file already has the environment variable configured:
```json
{
  "env": {
    "VITE_API_BASE_URL": "https://guardian-atc-gestion-des-incidents.onrender.com/api"
  }
}
```

However, Vite requires environment variables to be available at **build time**. If this doesn't work, use Option 1.

### Option 3: Auto-Detection (Fallback)

The code now includes auto-detection:
- If running on a Vercel domain (`*.vercel.app`), it automatically uses the Render backend
- This works even if the environment variable isn't set

## Verification

After setting the environment variable:

1. **Redeploy** your Vercel application
2. Check the browser console (F12) - you should see:
   ```
   🔧 API Configuration:
     - Base URL: https://guardian-atc-gestion-des-incidents.onrender.com/api
   ```
3. Try logging in - it should connect to Render backend, not localhost

## Troubleshooting

### Still seeing localhost error?

1. **Clear browser cache** and hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. **Check Vercel build logs** - verify the environment variable is being used
3. **Verify in Vercel dashboard** that the variable is set for the correct environment
4. **Redeploy** after making changes

### Check Current Configuration

Open browser console on your Vercel app and check:
```javascript
// Should show Render URL, not localhost
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
```

## Notes

- Vite environment variables must be prefixed with `VITE_`
- Environment variables are embedded at **build time**, not runtime
- Changes to environment variables require a **new deployment**

## Auto-Detection Feature

The code now includes **automatic detection** as a fallback:
- If the app is running on a Vercel domain (`*.vercel.app`), it automatically uses the Render backend
- This means even if the environment variable isn't set, it should still work
- However, it's still recommended to set `VITE_API_BASE_URL` explicitly in Vercel

## Quick Fix Steps

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add**: `VITE_API_BASE_URL` = `https://guardian-atc-gestion-des-incidents.onrender.com/api`
3. **Select all environments** (Production, Preview, Development)
4. **Redeploy** your application
5. **Test** by opening your Vercel app and checking the browser console

The auto-detection should work immediately, but setting the environment variable ensures it works correctly in all scenarios.
