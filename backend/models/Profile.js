import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  occupation: { type: String, default: 'Student / Professional' },
  budget: { type: [Number], default: [10000, 25000] },
  foodPref: { type: String, default: 'Veg' },
  sleepSchedule: { type: String, default: 'Early Bird' },
  cleanliness: { type: Number, min: 1, max: 5, default: 4 },
  smokingDrinking: { type: String, default: 'Non-Smoker / Non-Drinker' },
  hobbies: [{ type: String }],
  preferredLocation: { type: String, default: 'Koramangala, Bangalore' },
  bio: { type: String, default: 'Looking for a compatible roommate!' }
}, { timestamps: true });

export const Profile = mongoose.model('Profile', profileSchema);
