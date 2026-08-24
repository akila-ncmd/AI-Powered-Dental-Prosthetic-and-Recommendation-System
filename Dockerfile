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

# 2. Install system libraries required by OpenCV (modern replacement for libgl1-mesa-glx)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    poppler-utils \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*


# 3. Copy everything into the container
COPY --chown=1000:1000 . /app

# 4. Create necessary directories and set permissions
RUN mkdir -p /app/DentalAI-Backend/app/uploads /app/DentalAI-Backend/app/outputs/predictions && \
    chmod -R 777 /app/DentalAI-Backend/app/uploads /app/DentalAI-Backend/app/outputs

# 5. Install Next.js Frontend Dependencies and Build
RUN npm install
RUN npm run build

# 6. Install FastAPI Backend Dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r DentalAI-Backend/requirements.txt

# 7. Install Flask PDF API Dependencies
RUN pip install --no-cache-dir -r pdf_api/requirements.txt

# 8. Make the startup script executable
RUN chmod +x start-hf.sh

# 9. Expose Hugging Face's required port (7860)
EXPOSE 7860

# 10. Start the orchestration script
CMD ["./start-hf.sh"]
