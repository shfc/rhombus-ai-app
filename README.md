# Rhombus AI App

A full-stack web application built with Django (backend) and React (frontend).

## Overview

This project consists of:
- **Backend**: Django application using Python 3.13 and uv for dependency management
- **Frontend**: React application using Vite, TypeScript, and pnpm

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
   git clone <repository-url>
   cd rhombus-ai-app
   ```

2. Start the application:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:8000

4. Create a Django superuser (optional):
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

3. Run database migrations (if needed):
   ```bash
   uv run python manage.py migrate
   ```

4. Start the development server:
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

3. Start the development server:
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
├── backend/          # Django backend
│   ├── app/         # Django app
│   ├── Dockerfile   # Backend Docker configuration
│   ├── pyproject.toml
│   └── uv.lock
├── frontend/         # React frontend
│   ├── src/
│   ├── Dockerfile   # Frontend Docker configuration
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml # Docker Compose configuration
└── README.md
```