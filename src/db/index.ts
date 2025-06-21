import mongoose, { ConnectOptions } from "mongoose";

// Add connection error handlers
// mongoose.connection.on('disconnected', () => {
//   console.log('\nMongoDB disconnected');
// });

// mongoose.connection.on('error', (err) => {
//   console.error('\nMongoDB connection error:', err);
// });

export const connectToDatabase = async (
  databaseUri: string,
  databaseName: string,
): Promise<void> => {
  try {
    if (!databaseUri || !databaseName) {
      throw new Error("Database URI or name are missing");
    }

    const options: ConnectOptions = {
      dbName: databaseName,
      // Reduced timeouts for serverless environment
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    };

    await mongoose.connect(databaseUri, options);
  } catch (error) {
    console.error("\nError connecting to the database:", error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error("\nError disconnecting from the database:", error);
    throw error;
  }
};

export async function withDatabase<T>(
  queryFn: () => Promise<T>,
  errorHandler?: (error: any) => any,
): Promise<T> {
  try {
    await connectToDatabase(
      process.env.MONGODB_URI!,
      process.env.MONGODB_DATABASE_NAME!,
    );
    const result = await queryFn();
    await disconnectDatabase();
    return result;
  } catch (error) {
    await disconnectDatabase();
    if (errorHandler) {
      return errorHandler(error);
    }
    return undefined as unknown as T;
  }
}
