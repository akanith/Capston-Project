# Stage 1: Build the React Frontend
FROM node:18-alpine AS build-stage
WORKDIR /app/frontend
COPY frontend/wildshield-app/package*.json ./
RUN npm install
COPY frontend/wildshield-app/ ./
RUN npm run build

# Stage 2: Setup the Python Backend
FROM python:3.9-slim
WORKDIR /app

# Install system dependencies for OpenCV and other ML libs
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/
COPY ml_training/ ./ml_training/
COPY models/ ./models/

# Create directory for frontend and copy the build from Stage 1
RUN mkdir -p backend/static/frontend
COPY --from=build-stage /app/frontend/dist ./backend/static/frontend/

# Expose port 7860 (required by Hugging Face)
EXPOSE 7860
ENV PORT=7860
ENV KMP_DUPLICATE_LIB_OK=TRUE

# Run model downloader and start server
CMD python backend/download_models.py && python backend/main.py
