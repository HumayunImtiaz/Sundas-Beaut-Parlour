import 'dotenv/config';

function getNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const config = {
  port: getNumber('PORT', 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  rateLimitWindowMs: getNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  rateLimitMax: getNumber('RATE_LIMIT_MAX', 100)
};
