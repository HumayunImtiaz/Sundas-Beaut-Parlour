import { body } from 'express-validator';
export const orderStatusValidation = [body('status').isIn(['Pending', 'Confirmed', 'Delivered']).withMessage('Invalid order status')];