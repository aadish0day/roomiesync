import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  id: { type: String, index: true },
  userId: { type: String, index: true },
  targetType: { type: String, enum: ['user', 'property', 'meal'], required: true },
  targetId: { type: String, required: true, index: true },
  authorName: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true }
}, { timestamps: true });

export const Review = mongoose.model('Review', reviewSchema);
