import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "scaffold_ai"

// if (!uri) {
//   throw new Error("MONGODB_URI is not set")
// }

let cachedClient: MongoClient | null = null

export async function getMongoClient() {
  if (cachedClient) return cachedClient
  if (!uri) {
    // Return a dummy client or throw error only when called?
    // For build time we might want to avoid crashing if env is missing
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PHASE) {
       throw new Error("MONGODB_URI is not set")
    }
    // Return mock or throw if strictly needed
    console.warn("MONGODB_URI is not set, database features will fail.")
    return new MongoClient("mongodb://localhost:27017") // Fallback to avoid build crash?
  }
  const client = new MongoClient(uri)
  cachedClient = await client.connect()
  return cachedClient
}

import { Document } from "mongodb"

export async function getCollection<T extends Document>(name: string) {
  const client = await getMongoClient()
  return client.db(dbName).collection<T>(name)
}
