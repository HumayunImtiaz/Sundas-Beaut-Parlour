import jwt from 'jsonwebtoken';
import type { RequestHandler } from 'express';
import { config } from '../config';
import { sendError } from '../types/api';

export const authMiddleware: RequestHandler = (request, response, next) => {
  const header = request.header('Authorization');
  if (!header?.startsWith('Bearer ')) return sendError(response, 401, 'Authentication token is required');
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret);
    if (typeof payload === 'string' || !payload.sub) return sendError(response, 401, 'Invalid authentication token');
    request.adminId = payload.sub;
    next();
  } catch { return sendError(response, 401, 'Invalid or expired authentication token'); }
};