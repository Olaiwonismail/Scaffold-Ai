import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"
const dbName = process.env.MONGODB_DB || "scaffold_ai"

let cachedClient: MongoClient | null = null

export async function getMongoClient() {
  if (cachedClient) return cachedClient
  const client = new MongoClient(uri)
  cachedClient = await client.connect()
  return cachedClient
}

export async function getCollection<T extends import("mongodb").Document>(name: string) {
  const client = await getMongoClient()
  return client.db(dbName).collection<T>(name)
}
