import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  id: { type: String, index: true },
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ['Flat', 'PG'], default: 'Flat' },
  sharingType: { type: String, default: 'Private Room in Shared Flat' },
  amenities: [{ type: String }],
  images: [{ type: String }],
  ownerName: { type: String, required: true },
  ownerContact: { type: String, required: true },
  ownerId: { type: String, index: true },
  userId: { type: String, index: true },
  status: { type: String, enum: ['verified', 'pending', 'rejected'], default: 'verified' }
}, { timestamps: true });

export const Property = mongoose.model('Property', propertySchema);
