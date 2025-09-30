# Python Backend (SpaCy Server)

NLP processing server using SpaCy for text embeddings and similarity matching.

## Features
- Text embedding generation
- SpaCy NLP processing
- CORS enabled for frontend integration
- Health check endpoint

## Setup

### 1. Install Dependencies
```bash
cd python-backend
pip install -r requirements.txt
```

### 2. Download SpaCy Model
```bash
python -m spacy download en_core_web_md
```

### 3. Run Server
```bash
python app.py
```
**Server runs on**: http://localhost:8000

## API Endpoints

### GET /
Health check and server info

### POST /embeddings
Generate text embeddings
```json
{
  "text": "your text here"
}
```

### GET /health
Server health status

## Deployment
- Deploy as separate Python service on Render/Railway
- Update `VITE_SPACY_API_URL` in frontend .env
- Update `SPACY_API_URL` in backend .env