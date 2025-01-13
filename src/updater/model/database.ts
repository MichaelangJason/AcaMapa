import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.DATABASE_NAME || 'planner';

// mongoose.set('debug', true);
// Connection options
const options: ConnectOptions = {
  dbName: DATABASE_NAME, // Specify the database name
};

// Add connection error handlers
// mongoose.connection.on('disconnected', () => {
//   console.log('\nMongoDB disconnected');
// });

// mongoose.connection.on('error', (err) => {
//   console.error('\nMongoDB connection error:', err);
// });

export const connectToDatabase = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(DATABASE_URI, {
        ...options,
        serverSelectionTimeoutMS: 5000, // Wait 5 seconds before timing out
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      });
      // console.log(`\nConnected to database: ${DATABASE_NAME}`);
    }
  } catch (error) {
    console.error('\nError connecting to the database:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    // console.log('\nDisconnected from the database');
  } catch (error) {
    console.error('\nError disconnecting from the database:', error);
  }
};

export async function ensureConnection() {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectToDatabase();
    } catch (error) {
      console.error('\nFailed to reconnect to database:', error);
      throw error;
    }
  }
}