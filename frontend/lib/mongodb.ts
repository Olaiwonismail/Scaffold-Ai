import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "scaffold_ai"

if (!uri) {
  throw new Error("MONGODB_URI is not set")
}

let cachedClient: MongoClient | null = null

export async function getMongoClient() {
  if (cachedClient) return cachedClient
  const client = new MongoClient(uri)
  cachedClient = await client.connect()
  return cachedClient
}

export async function getCollection<T>(name: string) {
  const client = await getMongoClient()
  return client.db(dbName).collection<T>(name)
}
