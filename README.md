# Sundas Beauty Parlour

Frontend website for Sundas Beauty Parlour, built with Next.js.

## Structure

- `frontend` - Next.js 14 App Router, TypeScript, and Tailwind CSS

## Run Locally

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

The catalog is stored in `frontend/lib/content.ts`, so the site runs without a database or API. Configure the WhatsApp number and map URL in `frontend/.env.local` before using order and map features.

## Production Environment

Set these variables in the frontend hosting dashboard before deploying:

```text
NEXT_PUBLIC_WHATSAPP_NUMBER=923001234567
NEXT_PUBLIC_MAP_EMBED_URL=https://www.google.com/maps?q=Sundas+Beauty+Parlour&output=embed
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/
```

In Vercel, import this repository and set:

- **Root Directory:** `frontend`
- **Framework Preset:** `Next.js`
- **Build Command:** `npm run build`
- **Output Directory:** leave the default