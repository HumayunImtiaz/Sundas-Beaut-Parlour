import type { RequestHandler } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../types/api';

export const validationHandler: RequestHandler = (request, response, next) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) return sendError(response, 400, errors.array().map((error) => error.msg).join(', '));
  next();
};