import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import { config } from '../config';
import { Admin } from '../models/Admin';
import { sendError, sendSuccess } from '../types/api';

export async function login(request: Request, response: Response) {
  const { email, password } = request.body;
  const admin = await Admin.findOne({ email }).select('+password');
  if (!admin || !(await bcrypt.compare(password, admin.password))) return sendError(response, 401, 'Invalid email or password');
  const token = jwt.sign({ role: admin.role }, config.jwtSecret, { subject: admin.id, expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] });
  return sendSuccess(response, 200, 'Login successful', { token });
}