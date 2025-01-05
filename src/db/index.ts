import mongoose, { ConnectOptions } from 'mongoose';

// Add connection error handlers
// mongoose.connection.on('disconnected', () => {
//   console.log('\nMongoDB disconnected');
// });

// mongoose.connection.on('error', (err) => {
//   console.error('\nMongoDB connection error:', err);
// });

export const connectToDatabase = async (databaseUri: string, databaseName: string): Promise<void> => {
  try {
    if (!databaseUri || !databaseName) {
      throw new Error("Database URI and name must be provided");
    }

    const options: ConnectOptions = {
      dbName: databaseName,
      // Reduced timeouts for serverless environment
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    };

    await mongoose.connect(databaseUri, options);
  } catch (error) {
    console.error('\nError connecting to the database:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error('\nError disconnecting from the database:', error);
    throw error;
  }
};