import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { initialData } from './seed/seedData.js';

// Import Mongoose Models
import { User } from './models/User.js';
import { Profile } from './models/Profile.js';
import { Property } from './models/Property.js';
import { MealPlan } from './models/MealPlan.js';
import { Agreement } from './models/Agreement.js';
import { Expense } from './models/Expense.js';
import { Review } from './models/Review.js';
import { Report } from './models/Report.js';
import { Notification } from './models/Notification.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Structured CORS headers for security
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));

// Configure 10mb body parser limit for photo uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Memory store fallback in case MongoDB instance is starting up or offline
let memoryStore = { ...initialData };

// Document Normalization Utility
const normalizeDoc = (doc) => {
  if (!doc) return doc;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const rawId = obj.id || obj._id;
  const idStr = rawId ? rawId.toString() : '';
  const mongoIdStr = obj._id ? obj._id.toString() : idStr;
  delete obj.password; // Do not expose password hashes or plaintext
  return {
    ...obj,
    id: idStr || mongoIdStr,
    _id: mongoIdStr || idStr
  };
};

const normalizeDocs = (docs) => {
  if (!Array.isArray(docs)) return [];
  return docs.map(d => normalizeDoc(d));
};

// Safe Mongoose Query Helper for ID matching
const buildIdQuery = (targetId, customField = 'userId') => {
  const isObjId = mongoose.Types.ObjectId.isValid(targetId);
  const conditions = [{ [customField]: targetId }, { id: targetId }];
  if (isObjId) {
    conditions.push({ _id: targetId });
  }
  return { $or: conditions };
};

// Database Seed Function
const seedMongoDB = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding MongoDB database with initial records...');
      await User.insertMany(initialData.users);
      await Profile.insertMany(initialData.profiles);
      await Property.insertMany(initialData.properties);
      await MealPlan.insertMany(initialData.mealPlans);
      await Agreement.insertMany(initialData.agreements);
      await Expense.insertMany(initialData.expenses);
      await Review.insertMany(initialData.reviews);
      if (initialData.reports && initialData.reports.length > 0) {
        await Report.insertMany(initialData.reports);
      }
      if (initialData.notifications && initialData.notifications.length > 0) {
        const notifCount = await Notification.countDocuments();
        if (notifCount === 0) {
          await Notification.insertMany(initialData.notifications);
        }
      }
      console.log('✅ MongoDB database seeded successfully!');
    }
  } catch (err) {
    console.warn('⚠️ Seeding warning:', err.message);
  }
};

// Initialize DB connection & seeding
connectDB().then(() => seedMongoDB());

// Health check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RoomieSync MongoDB API Connected!' });
});

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user = null;
    try {
      user = await User.findOne({ email });
    } catch (dbErr) {
      console.warn('DB lookup failed during login, falling back to memoryStore:', dbErr.message);
    }
    if (!user) {
      user = memoryStore.users.find(u => u.email === email);
    }

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let isPasswordMatch = false;
    if (typeof user.password === 'string' && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      isPasswordMatch = await bcrypt.compare(password, user.password);
    } else {
      isPasswordMatch = (user.password === password);
    }

    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userIdStr = (user.id || user._id).toString();

    // Update login timestamp in MongoDB using findOneAndUpdate
    try {
      await User.findOneAndUpdate(
        buildIdQuery(userIdStr, 'id'),
        { $set: { updatedAt: new Date() } },
        { new: true }
      );
    } catch (dbErr) {
      console.warn('Failed to update login timestamp in DB:', dbErr.message);
    }

    const normalizedUser = normalizeDoc(user);

    let profile = null;
    try {
      profile = await Profile.findOne(buildIdQuery(userIdStr, 'userId'));
    } catch (dbErr) {
      console.warn('DB profile lookup failed, using memoryStore fallback:', dbErr.message);
    }
    if (!profile) {
      profile = memoryStore.profiles.find(p => p.userId === userIdStr) || {};
    }

    const normalizedProfile = normalizeDoc(profile);
    const token = `jwt_token_${userIdStr}_${Date.now()}`;
    return res.json({ token, user: normalizedUser, profile: normalizedProfile });
  } catch (err) {
    console.error('Error in POST /api/auth/login:', err);
    return res.status(500).json({ error: err.message || 'Server error during login' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    let existing = null;
    try {
      existing = await User.findOne({ email });
    } catch (dbErr) {
      console.warn('DB lookup failed during registration:', dbErr.message);
    }
    if (!existing) {
      existing = memoryStore.users.find(u => u.email === email);
    }

    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const userId = `usr_${Date.now()}`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newUser = null;
    let newProfile = null;

    try {
      newUser = await User.create({
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: role || 'user'
      });
      newProfile = await Profile.create({
        userId: userId,
        budget: [12000, 24000],
        occupation: 'Tech Professional',
        foodPref: 'Veg',
        sleepSchedule: 'Early Bird',
        cleanliness: 4,
        smokingDrinking: 'Non-Smoker / Non-Drinker',
        hobbies: ['Fitness', 'Reading', 'Music'],
        preferredLocation: 'Koramangala, Bangalore',
        bio: 'Excited to find compatible roommates!'
      });
    } catch (dbErr) {
      console.warn('DB create failed, using memoryStore fallback for registration:', dbErr.message);
    }

    const userObj = newUser ? normalizeDoc(newUser) : {
      id: userId,
      _id: userId,
      name,
      email,
      role: role || 'user',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    const profileObj = newProfile ? normalizeDoc(newProfile) : {
      userId: userId,
      budget: [12000, 24000],
      occupation: 'Tech Professional',
      foodPref: 'Veg',
      sleepSchedule: 'Early Bird',
      cleanliness: 4,
      smokingDrinking: 'Non-Smoker / Non-Drinker',
      hobbies: ['Fitness', 'Reading', 'Music'],
      preferredLocation: 'Koramangala, Bangalore',
      bio: 'Excited to find compatible roommates!'
    };

    memoryStore.users.push(userObj);
    memoryStore.profiles.push(profileObj);

    const token = `jwt_token_${userId}_${Date.now()}`;
    return res.json({ token, user: userObj, profile: profileObj });
  } catch (err) {
    console.error('Error in POST /api/auth/register:', err);
    return res.status(500).json({ error: err.message || 'Server error during registration' });
  }
});

// Users & Profile Routes
app.get('/api/users', async (req, res) => {
  try {
    let users = await User.find();
    if (!users || users.length === 0) users = memoryStore.users || [];
    return res.json(normalizeDocs(users));
  } catch (err) {
    console.warn('DB query error in GET /api/users, returning memoryStore fallback:', err.message);
    return res.json(normalizeDocs(memoryStore.users || []));
  }
});

app.put('/api/users/:id/verify', async (req, res) => {
  try {
    const userId = req.params.id;
    const { isVerified } = req.body;
    let updatedUser = null;

    try {
      updatedUser = await User.findOneAndUpdate(
        buildIdQuery(userId, 'id'),
        { $set: { isVerified: Boolean(isVerified) } },
        { new: true }
      );
    } catch (dbErr) {
      console.warn('DB update user verify failed:', dbErr.message);
    }

    const memIdx = memoryStore.users.findIndex(u => u.id === userId || u._id === userId);
    if (memIdx !== -1) {
      memoryStore.users[memIdx].isVerified = Boolean(isVerified);
      if (!updatedUser) updatedUser = memoryStore.users[memIdx];
    }

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ message: 'User verification status updated successfully', user: normalizeDoc(updatedUser) });
  } catch (err) {
    console.error('Error in PUT /api/users/:id/verify:', err);
    return res.status(500).json({ error: err.message || 'Failed to update user verification' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    try {
      await User.deleteOne(buildIdQuery(userId, 'id'));
      await Profile.deleteOne({ userId });
    } catch (dbErr) {
      console.warn('DB delete user failed:', dbErr.message);
    }

    memoryStore.users = memoryStore.users.filter(u => u.id !== userId && u._id !== userId);
    memoryStore.profiles = memoryStore.profiles.filter(p => p.userId !== userId);

    return res.json({ message: 'User account removed successfully', id: userId });
  } catch (err) {
    console.error('Error in DELETE /api/users/:id:', err);
    return res.status(500).json({ error: err.message || 'Failed to remove user' });
  }
});

app.get('/api/profile/:userId', async (req, res) => {
  try {
    const targetId = req.params.userId;
    let user = null;
    let profile = null;

    try {
      user = await User.findOne(buildIdQuery(targetId, 'id'));
      profile = await Profile.findOne(buildIdQuery(targetId, 'userId'));
    } catch (dbErr) {
      console.warn('DB query error in GET /api/profile:', dbErr.message);
    }

    if (!user) user = memoryStore.users.find(u => u.id === targetId || u._id === targetId);
    if (!profile) profile = memoryStore.profiles.find(p => p.userId === targetId) || {};

    const normalizedProfile = normalizeDoc(profile) || {};
    const normalizedUser = user ? normalizeDoc(user) : null;

    return res.json({ 
      ...normalizedProfile, 
      name: normalizedUser?.name || profile?.name, 
      email: normalizedUser?.email || profile?.email, 
      avatar: normalizedUser?.avatar || profile?.avatar 
    });
  } catch (err) {
    console.error('Error in GET /api/profile/:userId:', err);
    const profile = memoryStore.profiles.find(p => p.userId === req.params.userId) || {};
    const user = memoryStore.users.find(u => u.id === req.params.userId || u._id === req.params.userId);
    return res.json({ ...normalizeDoc(profile), name: user?.name, email: user?.email, avatar: user?.avatar });
  }
});

app.put('/api/profile/:userId', async (req, res) => {
  try {
    const targetId = req.params.userId;
    let profile = null;

    try {
      profile = await Profile.findOneAndUpdate(
        buildIdQuery(targetId, 'userId'),
        { $set: req.body },
        { new: true, upsert: true }
      );
    } catch (dbErr) {
      console.warn('DB profile update error:', dbErr.message);
    }

    let idx = memoryStore.profiles.findIndex(p => p.userId === targetId);
    if (idx !== -1) {
      memoryStore.profiles[idx] = { ...memoryStore.profiles[idx], ...req.body };
    } else {
      memoryStore.profiles.push({ userId: targetId, ...req.body });
    }

    const resultProfile = profile ? normalizeDoc(profile) : req.body;
    return res.json({ message: 'Profile updated successfully', profile: resultProfile });
  } catch (err) {
    console.error('Error in PUT /api/profile/:userId:', err);
    return res.status(500).json({ error: err.message || 'Server error updating profile' });
  }
});

// Properties Routes
app.get('/api/properties', async (req, res) => {
  try {
    let properties = await Property.find();
    if (!properties || properties.length === 0) properties = memoryStore.properties || [];
    return res.json(normalizeDocs(properties));
  } catch (err) {
    console.warn('DB query error in GET /api/properties, returning memoryStore fallback:', err.message);
    return res.json(normalizeDocs(memoryStore.properties || []));
  }
});

app.post('/api/properties', async (req, res) => {
  try {
    const { title, location, price, ownerContact, ownerName, type, description, amenities, images, ownerId, sharingType } = req.body || {};

    const numPrice = Number(price);
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Property title is required' });
    }
    if (!location || typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({ error: 'Property location is required' });
    }
    if (price === undefined || price === null || isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: 'Property price must be a positive number' });
    }
    if (!ownerContact || typeof ownerContact !== 'string' || !ownerContact.trim()) {
      return res.status(400).json({ error: 'Owner contact details are required' });
    }

    const propId = `prop_${Date.now()}`;
    const propertyPayload = {
      id: propId,
      title: title.trim(),
      location: location.trim(),
      price: numPrice,
      type: type || 'PG',
      sharingType: sharingType || (type === 'PG' ? 'Twin Sharing' : 'Private Room in Shared Flat'),
      description: description ? description.trim() : 'Modern co-living suite with great connectivity.',
      amenities: Array.isArray(amenities) && amenities.length ? amenities : ['WiFi', 'Power Backup', 'Security 24/7'],
      images: Array.isArray(images) && images.length ? images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
      ownerName: ownerName || 'Landlord Owner',
      ownerContact: ownerContact.trim(),
      ownerId: ownerId || 'owner_1',
      status: 'verified'
    };

    let createdProp = null;
    try {
      createdProp = await Property.create(propertyPayload);
    } catch (dbErr) {
      console.warn('DB property create error, using memoryStore fallback:', dbErr.message);
    }

    const resultProp = createdProp ? normalizeDoc(createdProp) : propertyPayload;
    memoryStore.properties.unshift(resultProp);
    return res.json(resultProp);
  } catch (err) {
    console.error('Error in POST /api/properties:', err);
    return res.status(500).json({ error: err.message || 'Server error creating property' });
  }
});

app.get('/api/properties/owner/:ownerId', async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    let properties = [];
    try {
      properties = await Property.find({ $or: [{ ownerId }, { userId: ownerId }] });
    } catch (dbErr) {
      console.warn('DB error fetching owner properties:', dbErr.message);
    }

    if (!properties || properties.length === 0) {
      properties = (memoryStore.properties || []).filter(p => p.ownerId === ownerId || p.userId === ownerId || (!p.ownerId && ownerId === 'usr_landlord'));
    }
    return res.json(normalizeDocs(properties));
  } catch (err) {
    console.error('Error in GET /api/properties/owner/:ownerId:', err);
    const props = (memoryStore.properties || []).filter(p => p.ownerId === req.params.ownerId || p.userId === req.params.ownerId || (!p.ownerId && req.params.ownerId === 'usr_landlord'));
    return res.json(normalizeDocs(props));
  }
});

app.put('/api/properties/:id/verify', async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { status } = req.body || {};
    const newStatus = status || 'verified';
    let updatedProp = null;

    try {
      updatedProp = await Property.findOneAndUpdate(
        buildIdQuery(propertyId, 'id'),
        { $set: { status: newStatus } },
        { new: true }
      );
    } catch (dbErr) {
      console.warn('DB update property verify failed:', dbErr.message);
    }

    if (!memoryStore.properties) memoryStore.properties = [];
    const memIdx = memoryStore.properties.findIndex(p => p.id === propertyId || p._id === propertyId);
    if (memIdx !== -1) {
      memoryStore.properties[memIdx].status = newStatus;
      if (!updatedProp) updatedProp = memoryStore.properties[memIdx];
    }

    if (!updatedProp) {
      return res.status(404).json({ error: 'Property not found' });
    }

    return res.json({ message: 'Property status updated successfully', property: normalizeDoc(updatedProp) });
  } catch (err) {
    console.error('Error in PUT /api/properties/:id/verify:', err);
    return res.status(500).json({ error: err.message || 'Failed to update property status' });
  }
});

app.delete('/api/properties/:id', async (req, res) => {
  try {
    const propertyId = req.params.id;

    try {
      await Property.deleteOne(buildIdQuery(propertyId, 'id'));
    } catch (dbErr) {
      console.warn('DB delete property failed:', dbErr.message);
    }

    if (memoryStore.properties) {
      memoryStore.properties = memoryStore.properties.filter(p => p.id !== propertyId && p._id !== propertyId);
    }

    return res.json({ message: 'Property listing removed successfully', id: propertyId });
  } catch (err) {
    console.error('Error in DELETE /api/properties/:id:', err);
    return res.status(500).json({ error: err.message || 'Failed to remove property' });
  }
});

app.post('/api/properties/book', async (req, res) => {
  try {
    const { propertyId, userId, date } = req.body || {};
    if (!propertyId || !userId || !date) {
      return res.status(400).json({ error: 'PropertyId, userId, and date are required for booking' });
    }

    const bookingId = `book_${Date.now()}`;
    const booking = {
      id: bookingId,
      propertyId,
      userId,
      date,
      status: 'Confirmed',
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Write booking notification to MongoDB via Notification.create()
    try {
      await Notification.create({
        id: `notif_${Date.now()}`,
        userId,
        recipientId: userId,
        title: 'Property Visit Scheduled',
        message: `Your visit for property ${propertyId} is scheduled on ${date}.`,
        type: 'property',
        isRead: false
      });
      await Property.findOneAndUpdate(
        buildIdQuery(propertyId, 'id'),
        { $set: { status: 'verified' } },
        { new: true }
      );
    } catch (dbErr) {
      console.warn('DB notification/property write on booking failed:', dbErr.message);
    }

    if (!memoryStore.bookings) memoryStore.bookings = [];
    memoryStore.bookings.unshift(booking);
    return res.json(booking);
  } catch (err) {
    console.error('Error in POST /api/properties/book:', err);
    return res.status(500).json({ error: err.message || 'Server error booking property' });
  }
});

app.get('/api/bookings/owner/:ownerId', async (req, res) => {
  try {
    const bookings = memoryStore.bookings || initialData.bookings || [];
    let properties = [];
    try {
      properties = await Property.find();
    } catch (dbErr) {
      console.warn('DB error fetching properties for bookings:', dbErr.message);
    }
    if (!properties || properties.length === 0) properties = memoryStore.properties || [];

    const normalizedProperties = normalizeDocs(properties);
    const result = bookings.map(b => ({
      ...b,
      property: normalizedProperties.find(p => p.id === b.propertyId || p._id === b.propertyId)
    }));
    return res.json(result);
  } catch (err) {
    console.error('Error in GET /api/bookings/owner/:ownerId:', err);
    return res.status(500).json({ error: err.message || 'Server error fetching owner bookings' });
  }
});

// Meal Plans Routes
app.get('/api/meals/plans', async (req, res) => {
  try {
    let plans = await MealPlan.find();
    if (!plans || plans.length === 0) plans = memoryStore.mealPlans || [];
    return res.json(normalizeDocs(plans));
  } catch (err) {
    console.warn('DB query error in GET /api/meals/plans, returning memoryStore fallback:', err.message);
    return res.json(normalizeDocs(memoryStore.mealPlans || []));
  }
});

app.post('/api/meals/subscribe', async (req, res) => {
  try {
    const { planId, userId, duration } = req.body || {};
    if (!planId || !userId) {
      return res.status(400).json({ error: 'PlanId and userId are required to subscribe' });
    }

    const sub = {
      id: `sub_${Date.now()}`,
      planId,
      userId,
      duration: duration || 'Monthly',
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0]
    };

    // Write subscription notification to MongoDB via Notification.create() & update MealPlan
    try {
      await Notification.create({
        id: `notif_${Date.now()}`,
        userId,
        recipientId: userId,
        title: 'Meal Plan Subscription Active',
        message: `Successfully subscribed to meal plan ${planId} (${duration || 'Monthly'}).`,
        type: 'meal',
        isRead: false
      });
      await MealPlan.findOneAndUpdate(
        buildIdQuery(planId, 'id'),
        { $inc: { reviewCount: 1 } },
        { new: true }
      );
    } catch (dbErr) {
      console.warn('DB write for meal subscription failed:', dbErr.message);
    }

    if (!memoryStore.subscriptions) memoryStore.subscriptions = [];
    memoryStore.subscriptions.unshift(sub);
    return res.json(sub);
  } catch (err) {
    console.error('Error in POST /api/meals/subscribe:', err);
    return res.status(500).json({ error: err.message || 'Server error subscribing to meal plan' });
  }
});

app.get('/api/meals/subscriptions/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const subs = (memoryStore.subscriptions || []).filter(s => s.userId === userId);
    return res.json(subs);
  } catch (err) {
    console.error('Error in GET /api/meals/subscriptions/:userId:', err);
    return res.status(500).json({ error: err.message || 'Server error fetching meal subscriptions' });
  }
});

// Expense Tracker Routes
app.get('/api/expenses', async (req, res) => {
  try {
    let expenses = await Expense.find();
    if (!expenses || expenses.length === 0) expenses = memoryStore.expenses || [];
    return res.json(normalizeDocs(expenses));
  } catch (err) {
    console.warn('DB query error in GET /api/expenses, returning memoryStore fallback:', err.message);
    return res.json(normalizeDocs(memoryStore.expenses || []));
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { title, amount, paidBy } = req.body || {};
    if (!title || amount === undefined || isNaN(Number(amount)) || !paidBy) {
      return res.status(400).json({ error: 'Expense title, valid numerical amount, and paidBy are required' });
    }

    const expPayload = {
      id: `exp_${Date.now()}`,
      ...req.body,
      date: req.body.date || new Date().toISOString().split('T')[0]
    };

    let createdExp = null;
    try {
      createdExp = await Expense.create(expPayload);
    } catch (dbErr) {
      console.warn('DB expense create error, using memoryStore fallback:', dbErr.message);
    }

    const resultExp = createdExp ? normalizeDoc(createdExp) : expPayload;
    memoryStore.expenses.unshift(resultExp);
    return res.json(resultExp);
  } catch (err) {
    console.error('Error in POST /api/expenses:', err);
    return res.status(500).json({ error: err.message || 'Server error creating expense' });
  }
});

// Digital Agreement Routes
app.get('/api/agreements/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    let agreements = [];
    try {
      agreements = await Agreement.find({
        $or: [
          { userId },
          { id: userId },
          ...(mongoose.Types.ObjectId.isValid(userId) ? [{ _id: userId }] : [])
        ]
      });
      if (!agreements || agreements.length === 0) {
        agreements = await Agreement.find();
      }
    } catch (dbErr) {
      console.warn('DB agreement query error:', dbErr.message);
    }

    if (!agreements || agreements.length === 0) {
      agreements = memoryStore.agreements || [];
    }
    return res.json(normalizeDocs(agreements));
  } catch (err) {
    console.warn('DB query error in GET /api/agreements, returning memoryStore fallback:', err.message);
    return res.json(normalizeDocs(memoryStore.agreements || []));
  }
});

app.post('/api/agreements', async (req, res) => {
  try {
    const { roommate1Name, roommate2Name, propertyAddress, totalRent } = req.body || {};
    if (!roommate1Name || !roommate2Name || !propertyAddress || !totalRent) {
      return res.status(400).json({ error: 'Roommate names, property address, and total rent are required' });
    }

    const agrPayload = {
      id: `agr_${Date.now()}`,
      ...req.body,
      status: 'Approved & Signed',
      createdAt: req.body.createdAt || new Date().toISOString().split('T')[0]
    };

    let createdAgr = null;
    try {
      createdAgr = await Agreement.create(agrPayload);
    } catch (dbErr) {
      console.warn('DB agreement create error, using memoryStore fallback:', dbErr.message);
    }

    const resultAgr = createdAgr ? normalizeDoc(createdAgr) : agrPayload;
    memoryStore.agreements.unshift(resultAgr);
    return res.json(resultAgr);
  } catch (err) {
    console.error('Error in POST /api/agreements:', err);
    return res.status(500).json({ error: err.message || 'Server error creating agreement' });
  }
});

// Reviews & Reports Routes
app.get('/api/reviews', async (req, res) => {
  try {
    let reviews = await Review.find();
    if (!reviews || reviews.length === 0) reviews = memoryStore.reviews || [];
    return res.json(normalizeDocs(reviews));
  } catch (err) {
    console.warn('DB query error in GET /api/reviews, returning memoryStore fallback:', err.message);
    return res.json(normalizeDocs(memoryStore.reviews || []));
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { targetType, targetId, authorName, rating, comment } = req.body || {};
    if (!targetType || !targetId || !authorName || rating === undefined || !comment) {
      return res.status(400).json({ error: 'Target details, authorName, rating, and comment are required' });
    }

    const revPayload = {
      id: `rev_${Date.now()}`,
      ...req.body,
      createdAt: req.body.createdAt || new Date().toISOString().split('T')[0]
    };

    let createdRev = null;
    try {
      createdRev = await Review.create(revPayload);
    } catch (dbErr) {
      console.warn('DB review create error, using memoryStore fallback:', dbErr.message);
    }

    const resultRev = createdRev ? normalizeDoc(createdRev) : revPayload;
    memoryStore.reviews.unshift(resultRev);
    return res.json(resultRev);
  } catch (err) {
    console.error('Error in POST /api/reviews:', err);
    return res.status(500).json({ error: err.message || 'Server error submitting review' });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    let reports = [];
    try {
      reports = await Report.find();
    } catch (dbErr) {
      console.warn('DB query error in GET /api/reports:', dbErr.message);
    }

    if (!reports || reports.length === 0) {
      reports = memoryStore.reports || [];
    }
    return res.json(normalizeDocs(reports));
  } catch (err) {
    console.error('Error in GET /api/reports:', err);
    return res.json(normalizeDocs(memoryStore.reports || []));
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const targetUserId = req.body.targetUserId || req.body.targetId || req.body.targetName;
    const reportedBy = req.body.reportedBy || req.body.reporterId || req.body.authorName;
    const reason = req.body.reason || req.body.category || 'User reported for investigation';
    if (!targetUserId || !reportedBy) {
      return res.status(400).json({ error: 'Target user details and reporter details are required' });
    }

    const repPayload = {
      id: `rep_${Date.now()}`,
      targetUserId,
      reportedBy,
      reason,
      status: 'Under Review',
      createdAt: req.body.createdAt || new Date().toISOString().split('T')[0]
    };

    let createdRep = null;
    try {
      createdRep = await Report.create(repPayload);
    } catch (dbErr) {
      console.warn('DB report create error, using memoryStore fallback:', dbErr.message);
    }

    const resultRep = createdRep ? normalizeDoc(createdRep) : repPayload;
    if (!memoryStore.reports) memoryStore.reports = [];
    memoryStore.reports.unshift(resultRep);
    return res.json(resultRep);
  } catch (err) {
    console.error('Error in POST /api/reports:', err);
    return res.status(500).json({ error: err.message || 'Server error filing report' });
  }
});

app.put('/api/reports/:id', async (req, res) => {
  try {
    const reportId = req.params.id;
    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ error: 'Report resolution status is required' });
    }

    let updatedRep = null;
    try {
      updatedRep = await Report.findOneAndUpdate(
        buildIdQuery(reportId, 'id'),
        { $set: { status } },
        { new: true }
      );
    } catch (dbErr) {
      console.warn('DB report resolution error:', dbErr.message);
    }

    if (!memoryStore.reports) memoryStore.reports = [];
    const memIdx = memoryStore.reports.findIndex(r => r.id === reportId || r._id === reportId);
    if (memIdx !== -1) {
      memoryStore.reports[memIdx].status = status;
      if (!updatedRep) updatedRep = memoryStore.reports[memIdx];
    }

    if (!updatedRep) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.json({ message: 'Report status updated successfully', report: normalizeDoc(updatedRep) });
  } catch (err) {
    console.error('Error in PUT /api/reports/:id:', err);
    return res.status(500).json({ error: err.message || 'Server error resolving report' });
  }
});

// Notifications Routes
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    let notifs = [];
    try {
      notifs = await Notification.find({
        $or: [
          { userId },
          { recipientId: userId },
          { id: userId },
          ...(mongoose.Types.ObjectId.isValid(userId) ? [{ _id: userId }] : [])
        ]
      });
    } catch (dbErr) {
      console.warn('DB notification query error:', dbErr.message);
    }
    if (!notifs || notifs.length === 0) {
      notifs = (memoryStore.notifications || []).filter(n => n.recipientId === userId || n.userId === userId);
    }
    return res.json(normalizeDocs(notifs));
  } catch (err) {
    console.error('Error in GET /api/notifications/:userId:', err);
    return res.status(500).json({ error: err.message || 'Server error fetching notifications' });
  }
});

// Admin Dashboard Routes
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    let userCount = 0;
    let propCount = 0;
    let mealCount = 0;
    let reports = [];
    let users = [];
    let expenses = [];

    try {
      userCount = await User.countDocuments();
      propCount = await Property.countDocuments();
      mealCount = await MealPlan.countDocuments();
      reports = await Report.find();
      users = await User.find();
      expenses = await Expense.find();
    } catch (dbErr) {
      console.warn('DB query error in admin dashboard, using memoryStore counts:', dbErr.message);
    }

    if (!userCount) userCount = memoryStore.users ? memoryStore.users.length : 0;
    if (!propCount) propCount = memoryStore.properties ? memoryStore.properties.length : 0;
    if (!mealCount) mealCount = memoryStore.mealPlans ? memoryStore.mealPlans.length : 0;
    if (!reports || reports.length === 0) reports = memoryStore.reports || [];
    if (!users || users.length === 0) users = memoryStore.users || [];
    if (!expenses || expenses.length === 0) expenses = memoryStore.expenses || [];

    const settledExpenses = (expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);

    return res.json({
      totalUsers: userCount,
      activeProperties: propCount,
      totalMealPlans: mealCount,
      settledExpenses,
      reports: normalizeDocs(reports),
      users: normalizeDocs(users)
    });
  } catch (err) {
    console.error('Error in GET /api/admin/dashboard:', err);
    return res.json({
      error: err.message || 'Server error fetching admin dashboard data',
      totalUsers: memoryStore.users ? memoryStore.users.length : 0,
      activeProperties: memoryStore.properties ? memoryStore.properties.length : 0,
      totalMealPlans: memoryStore.mealPlans ? memoryStore.mealPlans.length : 0,
      settledExpenses: 0,
      reports: normalizeDocs(memoryStore.reports || []),
      users: normalizeDocs(memoryStore.users || [])
    });
  }
});

// Fallback 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found` });
});

// Centralized Express Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 RoomieSync MongoDB Backend Server running on port ${PORT}`);
});
