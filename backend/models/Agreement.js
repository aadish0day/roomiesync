import mongoose from 'mongoose';

const agreementSchema = new mongoose.Schema({
  id: { type: String, index: true },
  userId: { type: String, index: true },
  roommate1Name: { type: String, required: true },
  roommate2Name: { type: String, required: true },
  propertyAddress: { type: String, required: true },
  totalRent: { type: Number, required: true },
  roommate1Share: { type: Number, default: 50 },
  roommate2Share: { type: Number, default: 50 },
  securityDeposit: { type: Number, default: 50000 },
  houseRules: [{ type: String }],
  status: { type: String, default: 'Approved & Signed' }
}, { timestamps: true });

export const Agreement = mongoose.model('Agreement', agreementSchema);
