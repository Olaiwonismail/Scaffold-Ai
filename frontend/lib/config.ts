// Use the Next.js rewrite proxy to avoid CORS/Mixed Content issues
const rawUrl = process.env.NEXT_PUBLIC_BACKEND_URL
// Ensure trailing slash so API paths concatenate correctly
export const BASE_URL = rawUrl
