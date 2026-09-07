import { model, Schema } from 'mongoose';

const adminSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'admin', enum: ['admin'] }
}, { timestamps: true });

export const Admin = model('Admin', adminSchema);