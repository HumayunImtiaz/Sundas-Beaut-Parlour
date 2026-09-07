import 'dotenv/config';

function getNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const config = {
  port: getNumber('PORT', 4000),
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/sundas-beauty-parlour',
  jwtSecret: process.env.JWT_SECRET ?? 'development-only-change-this-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  adminEmail: process.env.ADMIN_EMAIL ?? '',
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  frontendOrigin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  rateLimitWindowMs: getNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  rateLimitMax: getNumber('RATE_LIMIT_MAX', 100)
};
