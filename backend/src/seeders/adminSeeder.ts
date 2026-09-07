import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { connectDatabase } from '../config/database';
import { config } from '../config';
import { Admin } from '../models/Admin';

async function seedAdmin() {
  if (!config.adminEmail || !config.adminPassword) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  await connectDatabase();
  const existingAdmin = await Admin.findOne({ email: config.adminEmail });
  if (existingAdmin) { console.log('Admin already exists'); return; }
  await Admin.create({ name: 'Sundas Admin', email: config.adminEmail, password: await bcrypt.hash(config.adminPassword, 12) });
  console.log('Admin created');
}

seedAdmin().catch((error) => { console.error('Admin seeder failed', error); process.exitCode = 1; });