import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { sendError } from '../types/api';

export const notFoundHandler: RequestHandler = (_request, response) => sendError(response, 404, 'Route not found');
export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5MB or smaller' : 'Invalid image upload';
    return sendError(response, 400, message);
  }
  if (error?.name === 'ValidationError' || error?.name === 'CastError') return sendError(response, 400, 'Invalid request data');
  if (error?.code === 11000) return sendError(response, 409, 'A record with this value already exists');
  console.error(error);
  return sendError(response, error?.statusCode ?? 500, error?.statusCode ? error.message : 'Internal server error');
};