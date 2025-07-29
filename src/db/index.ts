import mongoose, { ConnectOptions } from "mongoose";
import { MongoClient, ServerApiVersion } from "mongodb";
// Add connection error handlers
// mongoose.connection.on('disconnected', () => {
//   console.log('\nMongoDB disconnected');
// });

// mongoose.connection.on('error', (err) => {
//   console.error('\nMongoDB connection error:', err);
// });
// mongoose.set('debug', { shell: true });

let connectionPromise: Promise<typeof mongoose> | null = null;

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

    connectionPromise = mongoose.connect(databaseUri, options);
    await connectionPromise;
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
    return result;
  } catch (error) {
    console.error("\nError in withDatabase:", error);
    if (errorHandler) {
      return errorHandler(error);
    }
    return undefined as unknown as T;
  }
  // disconnect database handling by serverless env
}

// asynchronous function to get a connected client, suitable for use in serverless functions
export async function getConnectedClient(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
  });

  return await client.connect();
}
