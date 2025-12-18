# Scaffold-AI

An AI-powered tutoring and learning platform that generates personalized lessons, quizzes, and provides interactive chatbot support.

## Architecture

This project consists of two main components:
- **Backend**: Python-based FastAPI server with AI/ML capabilities
- **Frontend**: Next.js application

## Backend Tools & Packages

### Core Framework
- **FastAPI** (v0.122.0) - Modern, fast web framework for building APIs
- **Uvicorn** (v0.38.0) - ASGI server for running FastAPI
- **Pydantic** (v2.12.4) - Data validation using Python type annotations

### AI/ML & Language Models
- **LangChain** (v1.0.8) - Framework for developing LLM applications
  - `langchain-google-genai` (v3.1.0) - Google Gemini integration
  - `langchain-ollama` (v1.0.0) - Ollama integration
  - `langchain-huggingface` (v1.0.1) - HuggingFace models integration
  - `langchain-chroma` (v1.0.0) - Chroma vector store integration
  - `langchain-community` (v0.4.1) - Community integrations
  - `langgraph` (v1.0.3) - Graph-based LLM workflows
- **Transformers** (v4.57.1) - HuggingFace transformers library
- **Sentence Transformers** (v5.1.2) - State-of-the-art sentence embeddings
- **Ollama** (v0.6.1) - Local LLM runtime

### Vector Database & Embeddings
- **ChromaDB** (v1.3.5) - Vector database for embeddings storage
- **FAISS-CPU** (v1.13.0) - Facebook's similarity search library

### Deep Learning & Scientific Computing
- **PyTorch** (v2.9.1) - Deep learning framework
- **NumPy** (v2.3.5) - Numerical computing
- **SciPy** (v1.16.3) - Scientific computing
- **scikit-learn** (v1.7.2) - Machine learning library
- **ONNX Runtime** (v1.23.2) - Machine learning model inference

### Document Processing
- **PyMuPDF** (v1.26.6) - PDF processing library
- **pypdf** (v6.3.0) - PDF manipulation
- **BeautifulSoup4** (v4.14.2) - HTML/XML parsing

### API & HTTP
- **httpx** (v0.28.1) - Async HTTP client
- **aiohttp** (v3.13.2) - Async HTTP client/server
- **requests** (v2.32.5) - HTTP library

### Environment & Configuration
- **python-dotenv** (v1.2.1) - Environment variable management
- **pydantic-settings** (v2.12.0) - Settings management

### Utilities
- **Rich** (v14.2.0) - Terminal formatting and display
- **Typer** (v0.20.0) - CLI application framework
- **coloredlogs** (v15.0.1) - Colored logging
- **tqdm** (v4.67.1) - Progress bars

### Database & ORM
- **SQLAlchemy** (v2.0.44) - SQL toolkit and ORM

### Monitoring & Telemetry
- **OpenTelemetry** - Observability framework
  - `opentelemetry-api` (v1.38.0)
  - `opentelemetry-sdk` (v1.38.0)
- **PostHog** (v5.4.0) - Product analytics

### Additional Dependencies
- **Python-Multipart** (v0.0.20) - Multipart form data parsing
- **Jinja2** (v3.1.6) - Template engine
- **PyYAML** (v6.0.3) - YAML parser
- **Pillow** (v12.0.0) - Image processing

## Backend Features

Based on the codebase analysis, the backend provides:

1. **AI Tutoring** (`/tutor` endpoint)
   - Personalized lesson generation
   - Adaptive learning with analogies
   - Uses Google Gemini AI (gemini-2.5-flash-lite)

2. **Quiz Generation** (`/quizes` endpoint)
   - Automated quiz creation from topics
   - JSON-formatted quiz cards

3. **Chatbot** (`/chatbot` endpoint)
   - Interactive Q&A support
   - Context-aware responses

4. **Document Upload** (`/upload_pdfs/` endpoint)
   - PDF document processing
   - YouTube URL support
   - Automatic outline generation
   - Vector store integration for retrieval

## Key Technologies

### LangChain Integration
The backend extensively uses LangChain for:
- LLM orchestration
- Vector store management (ChromaDB)
- Document loading and processing
- Embeddings generation

### Vector Search
- Uses ChromaDB as the vector database
- HuggingFace embeddings for semantic search
- FAISS for similarity search operations

### AI Models
- Primary model: Google Gemini 2.5 Flash Lite
- Support for local models via Ollama
- HuggingFace model integration

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with required API keys:
```
GOOGLE_API_KEY=your_google_api_key
```

4. Run the server:
```bash
uvicorn app:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

See [frontend/README.md](frontend/README.md) for frontend setup instructions.

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
Scaffold-AI/
├── backend/
│   ├── app.py                 # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── llm_services/         # LLM integration services
│   │   ├── bot.py           # Chatbot logic
│   │   └── outline.py       # Outline generation
│   ├── tools/                # Utility tools
│   │   ├── embeddings.py    # Embedding functions
│   │   ├── vector_store.py  # Vector DB setup
│   │   ├── model.py         # LLM model config
│   │   └── outline_tool.py  # Outline tools
│   ├── loaders/             # Document loaders
│   │   ├── pdf_loader.py    # PDF processing
│   │   └── multiple_file.py # Multi-file handling
│   └── documents/           # Uploaded documents
└── frontend/                 # Next.js frontend
```

## License

[Add license information here]

## Contributing

[Add contributing guidelines here]
