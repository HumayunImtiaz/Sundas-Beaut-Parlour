import { Router } from 'express';
import { login } from '../controllers/authController';
import { validationHandler } from '../middlewares/validationHandler';
import { asyncHandler } from '../utils/asyncHandler';
import { loginValidation } from '../validators/authValidators';
const router = Router();
router.post('/login', loginValidation, validationHandler, asyncHandler(login));
export default router;