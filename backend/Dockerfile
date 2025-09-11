# Use the official Python image from the Docker Hub
FROM python:3.13-slim

# Set the working directory in the container
WORKDIR /app

# Install uv
RUN pip install uv

# Copy the pyproject.toml and uv.lock files
COPY pyproject.toml uv.lock ./

# Install the dependencies using uv
RUN uv sync --frozen

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]