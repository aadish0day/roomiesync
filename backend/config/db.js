import mongoose from 'mongoose';

export const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/roomiesync';

  // Attach lifecycle event listeners to handle connection drops gracefully with auto-reconnect logging
  if (!mongoose.connection.listeners('connected').length) {
    mongoose.connection.on('connected', () => {
      console.log('🍃 Mongoose connected to MongoDB server');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Mongoose connection disconnected. Automatic reconnection will be attempted.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose connection re-established with MongoDB');
    });
  }

  const options = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10
  };

  try {
    const conn = await mongoose.connect(MONGO_URI, options);
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection warning: ${error.message}. (Using simulated data engine fallback)`);
    return null;
  }
};
