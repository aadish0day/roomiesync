import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  id: { type: String, index: true },
  userId: { type: String, index: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, enum: ['Rent', 'Utilities', 'Groceries', 'Maintenance', 'Other'], default: 'Other' },
  paidBy: { type: String, required: true, index: true },
  splitBetween: [{ type: String }],
  status: { type: String, enum: ['Pending', 'Settled'], default: 'Pending' },
  date: { type: String }
}, { timestamps: true });

export const Expense = mongoose.model('Expense', expenseSchema);
