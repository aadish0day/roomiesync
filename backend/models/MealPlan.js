import mongoose from 'mongoose';

const mealPlanSchema = new mongoose.Schema({
  id: { type: String, index: true },
  providerName: { type: String, required: true },
  chefName: { type: String, required: true },
  rating: { type: Number, default: 4.8 },
  reviewCount: { type: Number, default: 0 },
  cuisine: { type: String, required: true },
  weeklyPrice: { type: Number, required: true },
  monthlyPrice: { type: Number, required: true },
  dietary: { type: String, default: 'Pure Veg' },
  weeklyMenu: { type: Map, of: String },
  image: { type: String }
}, { timestamps: true });

export const MealPlan = mongoose.model('MealPlan', mealPlanSchema);
