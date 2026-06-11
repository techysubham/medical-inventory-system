#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/User.js';

// Load .env located in the backend folder (regardless of working directory)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Ensure DNS can resolve MongoDB Atlas SRV records (fixes querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('DNS servers set to Google Public DNS: 8.8.8.8, 8.8.4.4');
} catch (e) {
  console.warn('Failed to set DNS servers, continuing with system defaults');
}

const createSuperAdmin = async () => {
  try {
    console.log('🔐 Medical Inventory - Super Admin Setup');
    console.log('=====================================\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected\n');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ isSuperAdmin: true });
    if (existingSuperAdmin) {
      console.log('✗ Super admin already exists:');
      console.log(`  Email: ${existingSuperAdmin.email}`);
      console.log(`  Name: ${existingSuperAdmin.firstName} ${existingSuperAdmin.lastName}`);
      process.exit(0);
    }

    // Hardcoded values for now - in production, use readline for prompts
    const superAdminData = {
      email: 'admin@whitecrown.com',
      password: 'admin111', // Change this password after first login
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      isSuperAdmin: true,
      isActive: true,
      permissions: [
        'view_inventory',
        'manage_inventory',
        'view_discounts',
        'manage_discounts',
        'view_invoices',
        'manage_invoices',
        'view_reports',
        'manage_users',
        'view_suppliers',
        'manage_suppliers',
        'view_settings',
        'manage_settings',
      ],
    };

    // Check if email already exists
    const existingUser = await User.findOne({ email: superAdminData.email });
    if (existingUser) {
      console.log(`✗ User with email ${superAdminData.email} already exists`);
      process.exit(1);
    }

    // Create super admin
    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    console.log('✓ Super admin created successfully!\n');
    console.log('📋 Super Admin Credentials:');
    console.log(`   Email: ${superAdminData.email}`);
    console.log(`   Password: ${superAdminData.password}`);
    console.log(`   Name: ${superAdminData.firstName} ${superAdminData.lastName}`);
    console.log('\n⚠️  IMPORTANT:');
    console.log('   - Use these credentials to login on the frontend');
    console.log('   - From the admin panel, create other users');
    console.log('   - Assign roles and permissions to each user');
    console.log('   - Change the super admin password after first login\n');

    await mongoose.disconnect();
    console.log('✓ Setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
};

createSuperAdmin();
