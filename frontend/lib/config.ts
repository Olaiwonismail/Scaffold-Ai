const rawUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
// Ensure trailing slash so API paths concatenate correctly
export const BASE_URL = rawUrl.endsWith('/') ? rawUrl : rawUrl + '/'
