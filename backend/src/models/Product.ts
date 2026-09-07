import { model, Schema } from 'mongoose';

const productSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  fullDescription: { type: String, required: true, trim: true, maxlength: 5000 },
  price: { type: Number, required: true, min: 0 },
  image: {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true }
  },
  stock: { type: Number, required: true, min: 0, default: 0 },
  isNew: { type: Boolean, default: false }
}, { timestamps: true });

export const Product = model('Product', productSchema);