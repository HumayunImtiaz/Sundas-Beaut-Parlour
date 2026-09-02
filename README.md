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