const rawUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
// Remove trailing slash to prevent double slashes in API calls
export const BASE_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl
