#!/bin/bash
# start-hf.sh - Orchestrates all 3 systems inside the Hugging Face Docker container

# 1. Start the FastAPI AI Backend on port 8000 (running in the background)
cd DentalAI-Backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
cd ..

# 2. Start the Flask PDF API on port 5000 (running in the background)
cd pdf_api
python app.py &
cd ..

# 3. Start the Next.js Frontend on port 7860 (Hugging Face default exposed port)
# Next.js Server-side routing will proxy backend requests to 127.0.0.1:8000 internal.
npm run start -- -p $PORT
