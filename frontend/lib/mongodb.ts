import { MongoClient, type Document } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "scaffold_ai"

if (!uri) {
  throw new Error("MONGODB_URI is not set")
}

let cachedClient: MongoClient | null = null

async function isConnectionHealthy(client: MongoClient): Promise<boolean> {
  try {
    // Ping the database to check if connection is alive
    await client.db(dbName).command({ ping: 1 })
    return true
  } catch {
    return false
  }
}

export async function getMongoClient() {
  // Check if cached client exists and is healthy
  if (cachedClient) {
    const healthy = await isConnectionHealthy(cachedClient)
    if (healthy) {
      return cachedClient
    }
    // Connection is stale, close and reconnect
    console.log("MongoDB connection stale, reconnecting...")
    try {
      await cachedClient.close()
    } catch {
      // Ignore close errors
    }
    cachedClient = null
  }
  
  const client = new MongoClient(uri!, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  cachedClient = await client.connect()
  return cachedClient
}

export async function getCollection<T extends Document>(name: string) {
  const client = await getMongoClient()
  return client.db(dbName).collection<T>(name)
}
