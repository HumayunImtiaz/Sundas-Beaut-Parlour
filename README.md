# Sundas Beauty Parlour

Beauty parlour website for Sundas Beauty Parlour, with a Next.js frontend and an Express API foundation.

## Structure

- `frontend` - Next.js 14 App Router, TypeScript, Tailwind CSS
- `backend` - Node.js, Express, and TypeScript API foundation

## Run Locally

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

In a second terminal:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

Configure the frontend WhatsApp number and map URL in `frontend/.env.local` before using booking and map features.

## Production Environment

Set these variables in the frontend hosting dashboard before deploying:

```text
NEXT_PUBLIC_API_URL=https://your-backend-domain.example/api
NEXT_PUBLIC_WHATSAPP_NUMBER=923001234567
NEXT_PUBLIC_MAP_EMBED_URL=https://www.google.com/maps?q=Sundas+Beauty+Parlour&output=embed
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/
```

The API URL must be the public backend URL, not `localhost`. Also set the backend `FRONTEND_URL` to the deployed frontend origin and make sure the backend is running before opening the site.