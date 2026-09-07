import type { Request } from 'express';

declare global {
  namespace Express {
    interface Request { adminId?: string }
  }
}

export type AuthenticatedRequest = Request & { adminId: string };