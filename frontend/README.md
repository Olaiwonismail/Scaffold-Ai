# StudyLabs Frontend

A beautifully designed, personalized learning platform with a simple interface and pastel color scheme.

## Features

- **Clean Design**: Simple, intuitive interface with pastel colors
- **Course Management**: Create and manage multiple learning courses
- **Personalized Learning**: AI-powered lessons adapted to your pace and interests
- **Progress Tracking**: Visual progress indicators for courses and lessons
- **Interactive Learning**: Engage with lessons, take quizzes, and get feedback

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Environment Variables

Create a `.env.local` file in `frontend/` with your credentials before running the app:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
MONGODB_URI=...
MONGODB_DB=scaffold_ai
```

Firebase values come from your Firebase project settings (Web app). `MONGODB_URI` should be a standard Mongo connection string (e.g., Atlas). `MONGODB_DB` defaults to `scaffold_ai` if omitted.

## Design System

- **Primary**: Dusty Lavender (#C6B1F0)
- **Secondary**: Mist Blue (#B9D7F5)
- **Accent**: Peach Glow (#FFD8B5)
- **Success**: Mint Cream (#BFE7D0)
- **Background**: Soft Porcelain (#F7F5FB)

## Technology

- Next.js 13+ with App Router
- Tailwind CSS for styling
- Framer Motion for animations
- Radix UI for accessible components

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
