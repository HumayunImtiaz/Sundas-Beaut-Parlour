import mongoose from 'mongoose';
import { config } from '../config';

export async function connectDatabase() {
  await mongoose.connect(config.mongodbUri);
  console.log('Database connected');
}