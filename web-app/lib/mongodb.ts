import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 60000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  ssl: true,
  tls: true,
  tlsInsecure: true,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }
  
  if (clientPromise) {
    return clientPromise;
  }

  // Singleton pattern - prevents connection leak
  if (process.env.NODE_ENV === 'development') {
    // In development, use a global variable to preserve connection across hot reloads
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production, create a new client
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
  
  return clientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getClientPromise();
  return client.db('predictlyai');
}

export async function getAnalysesCollection() {
  const db = await getDatabase();
  return db.collection('analyses');
}

// Initialize TTL index (call once on startup)
export async function initializeIndexes() {
  try {
    const collection = await getAnalysesCollection();
    
    // TTL index - MongoDB automatically deletes expired documents
    await collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );
    
    // Unique index on slug for fast lookups and upsert
    await collection.createIndex(
      { slug: 1 },
      { unique: true }
    );
    
    console.log('? MongoDB indexes initialized');
  } catch (error) {
    console.error('MongoDB index initialization error:', error);
  }
}

export { getClientPromise as default };
