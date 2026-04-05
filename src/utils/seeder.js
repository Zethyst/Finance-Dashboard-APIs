require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { ROLES, TRANSACTION_TYPES, TRANSACTION_CATEGORIES } = require('../config/constants');

const seed = async () => {
  await connectDB();

  console.log('🌱 Seeding database...');

  // Clear existing data
  await User.deleteMany({});
  await Transaction.deleteMany({});

  // Create users
  const users = await User.create([
    { name: 'Alice Admin', email: 'admin@example.com', password: 'Admin@1234', role: ROLES.ADMIN },
    { name: 'Bob Analyst', email: 'analyst@example.com', password: 'Analyst@1234', role: ROLES.ANALYST },
    { name: 'Carol Viewer', email: 'viewer@example.com', password: 'Viewer@1234', role: ROLES.VIEWER },
  ]);

  console.log(`✅ Created ${users.length} users`);

  const admin = users[0];

  // Create 30 sample transactions spread across last 3 months
  const transactions = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    const type = i % 3 === 0 ? TRANSACTION_TYPES.INCOME : TRANSACTION_TYPES.EXPENSE;
    const incomeCategories = ['salary', 'freelance', 'investment', 'rental', 'business'];
    const expenseCategories = ['food', 'transport', 'utilities', 'entertainment', 'healthcare', 'shopping'];

    const category = type === TRANSACTION_TYPES.INCOME
      ? incomeCategories[Math.floor(Math.random() * incomeCategories.length)]
      : expenseCategories[Math.floor(Math.random() * expenseCategories.length)];

    transactions.push({
      amount: parseFloat((Math.random() * 5000 + 100).toFixed(2)),
      type,
      category,
      date,
      description: `Sample ${type} - ${category}`,
      createdBy: admin._id,
    });
  }

  await Transaction.create(transactions);
  console.log(`✅ Created ${transactions.length} transactions`);

  console.log('\n📋 Test Credentials:');
  console.log('  Admin:    admin@example.com    / Admin@1234');
  console.log('  Analyst:  analyst@example.com  / Analyst@1234');
  console.log('  Viewer:   viewer@example.com   / Viewer@1234');

  await mongoose.disconnect();
  console.log('\n✅ Seeding complete!');
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});