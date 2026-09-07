import { body, param } from 'express-validator';
export const idParam = param('id').isMongoId().withMessage('Valid id is required');
export const slugParam = param('slug').isSlug().withMessage('Valid slug is required');
export const nameField = body('name').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters');
export const priceField = body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number');
