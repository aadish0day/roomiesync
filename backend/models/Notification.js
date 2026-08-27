import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  id: { type: String, index: true },
  userId: { type: String, index: true },
  recipientId: { type: String, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'general' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
