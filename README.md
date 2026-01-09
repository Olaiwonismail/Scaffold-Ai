# Scaffold-Ai

Scaffold-Ai is a comprehensive personalized learning platform that leverages Artificial Intelligence to create adaptive learning experiences. It combines a modern, pastel-themed frontend with a powerful backend capable of processing documents and generating tailored course content, quizzes, and tutoring sessions.

## 🚀 Features

- ** Learning Paths**: AI-generated course outlines and lessons based on user inputs and uploaded documents.
- **Interactive AI Tutor**: A chatbot interface for real-time tutoring and doubt resolution.
- **Dynamic Quizzes**: Automatically generated quizzes to test knowledge and reinforce learning.
- **Document Integration**: Upload PDFs and provide YouTube URLs to generate context-aware learning materials.
- **Progress Tracking**: Visual indicators for course completion and lesson progress.
- **Clean & Modern UI**: A user-friendly interface built with Next.js and Tailwind CSS, featuring a soothing pastel color palette.
- **Math Support**: Rendering of mathematical equations using KaTeX.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 13+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide React
- **Animations**: Framer Motion
- **Math Rendering**: KaTeX

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Language**: Python
- **AI/LLM**: Google Gemini (via `google-ai-generativelanguage`), LangChain (implied)
- **Vector Store**: Qdrant / ChromaDB / Faiss (for document embeddings and retrieval)
- **Document Processing**: PDF loaders, YouTube transcript loaders

## 📂 Project Structure

```
Scaffold-Ai/
├── backend/                 # FastAPI Backend
│   ├── app.py              # Main application entry point
│   ├── llm_services/       # AI/LLM logic (bot, outline generation)
│   ├── loaders/            # Document loaders (PDF, etc.)
│   ├── tools/              # Utility tools (embeddings, models)
│   ├── qdrant_data/        # Vector store data
│   └── requirements.txt    # Python dependencies
│
└── frontend/                # Next.js Frontend
    ├── app/                # App Router pages and layouts
    ├── components/         # Reusable UI components
    ├── lib/                # Utility functions and API clients
    └── package.json        # Node.js dependencies
```

## ⚡ Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **Python** (v3.10+ recommended)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/Olaiwonismail/Scaffold-Ai.git
cd Scaffold-Ai
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment (optional but recommended):

```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Set up environment variables:
Create a `.env` file in the `backend` directory and add your API keys:

```env
GOOGLE_API_KEY=your_google_api_key_here
```

Run the server:

```bash
uvicorn app:app --reload
```
The backend API will be available at `http://localhost:8000`.

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Run the development server:

```bash
npm run dev
```
The frontend application will be available at `http://localhost:3000`.

## 📖 Usage

1.  **Sign Up/Login**: Create an account to track your progress.
2.  **Create a Course**: Upload relevant PDF documents or provide YouTube links to generate a new course.
3.  **Learn**: Navigate through the generated lessons.
4.  **Quiz**: Take quizzes to test your understanding.
5.  **Chat**: Use the AI tutor for specific questions related to the course material.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

[MIT](LICENSE)
