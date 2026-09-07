import { model, Schema } from 'mongoose';

const orderSchema = new Schema({
  customerName: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  address: { type: String, required: true, trim: true, maxlength: 500 },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  notes: { type: String, trim: true, maxlength: 1000 },
  paymentMethod: { type: String, default: 'Cash on Delivery', enum: ['Cash on Delivery'] },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Confirmed', 'Delivered'] }
}, { timestamps: true });

export const Order = model('Order', orderSchema);