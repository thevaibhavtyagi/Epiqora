import mongoose from 'mongoose';
import { config } from './environment.js';

/**
 * Establishes a connection to the MongoDB Atlas cluster.
 * Engineered for stability: If the DB fails, the AI app still runs (Stateless Fallback).
 */
export const connectDB = async () => {
  try {
    if (!config.mongoUri) {
      console.warn('⚠️ [DB] MONGO_URI not found in .env. Running in stateless mode (No Telemetry).');
      return false;
    }

    const conn = await mongoose.connect(config.mongoUri);

    console.log(`✅ [DB] MongoDB Connected Successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ [DB] MongoDB Connection Error: ${error.message}`);
    // We return false instead of process.exit(1) so the main AI app survives
    return false;
  }
};

export default connectDB;