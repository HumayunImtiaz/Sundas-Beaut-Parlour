import { body } from 'express-validator';
import { nameField, priceField } from './common';
export const serviceValidation = [nameField, body('description').isString().trim().isLength({ min: 2, max: 2000 }).withMessage('Description is required'), priceField];