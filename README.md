# LikeMind Connect

A social networking platform that connects people based on shared interests and hobbies.

## Features

- **User Authentication**: Secure signup/login with email verification
- **Password Reset**: Secure password reset with single-use tokens
- **Profile Management**: Complete user profiles with hobbies and interests
- **Smart Matching**: AI-powered matching based on shared interests
- **Real-time Chat**: Socket.io powered messaging system
- **Follow System**: Connect with like-minded people
- **Notifications**: Real-time notifications for connections and messages
- **Security**: HTTPS enforcement, rate limiting, and secure sessions

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- Socket.io for real-time features
- Nodemailer for email services
- Cloudinary for image uploads
- bcryptjs for password hashing

### Frontend
- React.js with Vite
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Socket.io client

### AI/ML
- Python with spaCy for NLP
- Pinecone for vector embeddings
- Google Gemini API for AI features

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Python 3.8+
- Gmail account for email services

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with your configuration:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_app_password
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   GEMINI_API_KEY=your_gemini_api_key
   PINECONE_API_KEY=your_pinecone_key
   PINECONE_INDEX_NAME=user-hobbies
   FRONTEND_URL=http://localhost:5173
   PORT=5000
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Python/spaCy Setup
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Start the spaCy server:
   ```bash
   python spacy_server.py
   ```

## Environment Variables

### Required Backend Variables
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `EMAIL_USER`: Gmail address for sending emails
- `EMAIL_PASS`: Gmail app password
- `CLOUDINARY_*`: Cloudinary configuration for image uploads
- `GEMINI_API_KEY`: Google Gemini API key
- `PINECONE_*`: Pinecone configuration for vector embeddings

### Optional Variables
- `TESTING_MODE`: Set to 'true' to simulate email sending
- `NODE_ENV`: Set to 'production' for production deployment

## Security Features

- **HTTPS Enforcement**: Automatic redirect to HTTPS in production
- **Rate Limiting**: Protection against brute force attacks
- **Secure Headers**: XSS protection, HSTS, content type options
- **HTTP-Only Cookies**: Secure session management
- **Password Hashing**: bcrypt with salt rounds
- **Single-Use Tokens**: Password reset tokens expire after use
- **Email Verification**: Required before account activation

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/verify-email/:token` - Verify email

### User Management
- `GET /api/auth/me` - Get current user
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile` - Update profile

### Social Features
- `GET /api/matches` - Get potential matches
- `POST /api/follow` - Follow a user
- `GET /api/followers` - Get followers list
- `GET /api/notifications` - Get notifications

### Chat
- `GET /api/chat/conversations` - Get chat conversations
- `POST /api/chat/send` - Send message

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email your-email@gmail.com or create an issue in the repository.