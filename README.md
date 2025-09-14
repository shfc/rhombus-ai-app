# Rhombus AI App

A full-stack web application built with Django (backend) and React (frontend) for regex pattern matching and replacement using natural language processing.

## Demo

Check out the video demo: [Video Demo](https://drive.google.com/file/d/1NZTN3FjUaSKXy3Fz8Wa5CTvvKM0Ktmp5/view?usp=sharing)


## Prerequisites

### For Docker Setup
- Docker
- Docker Compose

### For Local Development
- Python 3.13+
- Node.js 20+
- pnpm
- uv (Python package manager)

## Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone git@github.com:shfc/rhombus-ai-app.git
   cd rhombus-ai-app
   ```

2. Set up environment variables:
   Copy the `.env.example` files to `.env` for both backend and frontend, and **set your `GOOGLE_API_KEY`** (required for LLM functionality):
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit backend/.env and replace 'your_gemini_api_key_here' with your actual Gemini API key from https://aistudio.google.com/app/apikey
   # Edit frontend/.env if you need to change the API URL
   ```

3. Start the application:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost

5. Create a Django superuser (optional):
   ```bash
   docker-compose exec rhombus-backend uv run python manage.py createsuperuser
   ```
   Then access the admin panel at http://localhost:8000/admin

## Local Development Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

3. Set up environment variables:
   Copy the `.env.example` file to `.env` and **set your `GOOGLE_API_KEY`** (required for LLM functionality):
   ```bash
   cp .env.example .env
   # Edit .env and replace 'your_gemini_api_key_here' with your actual Gemini API key from https://aistudio.google.com/app/apikey
   ```

4. Run database migrations (if needed):
   ```bash
   uv run python manage.py migrate
   ```

5. Start the development server:
   ```bash
   uv run python manage.py runserver
   ```

The backend will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables (optional):
   Copy the `.env.example` file to `.env` and modify if needed:
   ```bash
   cp .env.example .env
   # Edit .env if you need to change the API URL or add other variables
   ```

4. Start the development server:
   ```bash
   pnpm run dev
   ```

The frontend will be available at http://localhost:5173 (default Vite port)

## Available Scripts

### Backend
- `uv run python manage.py runserver` - Start development server
- `uv run python manage.py migrate` - Run database migrations
- `uv run python manage.py createsuperuser` - Create admin user

### Frontend
- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint

## Project Structure

```
rhombus-ai-app/
├── backend/                    # Django backend
│   ├── Dockerfile             # Backend Docker configuration
│   ├── manage.py              # Django management script
│   ├── pyproject.toml         # Python dependencies
│   ├── uv.lock                # Dependency lock file
│   ├── rhombus_ai/            # Django project settings
│   ├── data_processing/       # Main Django app
│   │   ├── models.py         # Database models
│   │   ├── views.py          # API endpoints
│   │   ├── llm_service.py    # Gemini AI integration
│   │   └── migrations/       # Database migrations
│   ├── db_data/              # SQLite database
│   ├── media/                # User uploaded files
│   └── static/               # Static files
├── frontend/                  # React frontend
│   ├── Dockerfile            # Frontend Docker configuration
│   ├── package.json          # Node.js dependencies
│   ├── vite.config.ts        # Vite configuration
│   ├── public/               # Static assets
│   └── src/                  # React application
│       ├── components/       # React components
│       ├── utils/           # Utility functions
│       └── config/          # Configuration files
├── docker-compose.yml        # Docker Compose configuration
└── README.md
```