# ---------------------------------------------
# Hugging Face Spaces Multi-Service Dockerfile
# Combines Next.js, FastAPI, and Flask
# ---------------------------------------------
FROM nikolaik/python-nodejs:python3.11-nodejs20

# 1. Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=7860 \
    BACKEND_URL=http://127.0.0.1:8000 \
    PDF_API_URL=http://127.0.0.1:5000 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# 2. Install system libraries required by OpenCV & YOLO
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# 3. Copy everything into the container
COPY . /app

# 4. Install Next.js Frontend Dependencies and Build
RUN npm install
RUN npm run build

# 5. Install FastAPI Backend Dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r DentalAI-Backend/requirements.txt

# 6. Install Flask PDF API Dependencies
RUN pip install --no-cache-dir -r pdf_api/requirements.txt

# 7. Make the startup script executable
RUN chmod +x start-hf.sh

# 8. Expose Hugging Face's required port (7860)
EXPOSE 7860

# 9. Start the orchestration script
CMD ["./start-hf.sh"]
