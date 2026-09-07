import type { Response } from 'express';

export function sendSuccess(response: Response, statusCode: number, message: string, data: unknown) {
  return response.status(statusCode).json({ status: true, statusCode, message, data });
}

export function sendError(response: Response, statusCode: number, message: string) {
  return response.status(statusCode).json({ status: false, statusCode, message, data: null });
}