import { model, Schema } from 'mongoose';

const serviceSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  price: { type: Number, required: true, min: 0 },
  image: {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true }
  }
}, { timestamps: true });

export const Service = model('Service', serviceSchema);