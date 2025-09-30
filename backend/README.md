# LikeMind Connect Backend

## Tech Stack
- Node.js (v18+)
- Express.js
- MongoDB + Mongoose
- spaCy embeddings API (local server)
- dotenv for environment variables
- bcrypt + JWT for auth
- CORS enabled for frontend

## API Endpoints

### Authentication
- `POST /api/signup` - Create user (name, email, password hashed)
- `POST /api/login` - Login and return JWT

### Profile
- `POST /api/profile` - Save user hobbies and generate embeddings (requires JWT)

### Matching
- `GET /api/matches` - Get top 5 similar users based on cosine similarity (requires JWT)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/likemind-connect
JWT_SECRET=your_jwt_secret_key_here
SPACY_API_URL=http://localhost:8000
PORT=5000
```

3. Start both services:
```bash
# Option 1: Use the batch file (Windows)
start_services.bat

# Option 2: Start manually
# Terminal 1: Install Python deps and start spaCy service
pip install -r requirements.txt
python -m spacy download en_core_web_md
python spacy_service.py

# Terminal 2: Start Node.js backend
npm run dev
```

## Database Schema

```javascript
User {
   name: String,
   email: String,
   password: String,
   hobbies: String,
   embedding: [Number],
   createdAt: Date
}
```

## Response Formats

### POST /api/matches
```json
[
  {
    "userId": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "similarityScore": 0.85
  }
]
```