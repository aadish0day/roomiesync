import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  id: { type: String, index: true },
  targetUserId: { type: String, required: true, index: true },
  reportedBy: { type: String, required: true, index: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Under Review', 'User Banned', 'Report Dismissed', 'Resolved'], 
    default: 'Under Review' 
  }
}, { timestamps: true });

export const Report = mongoose.model('Report', reportSchema);
