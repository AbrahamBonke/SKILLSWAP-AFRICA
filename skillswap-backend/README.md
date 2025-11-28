# SkillSwap Africa - Backend Setup Instructions

## Phoenix Framework Backend

This directory contains the Elixir Phoenix backend for SkillSwap Africa.

### Setup Steps

1. **Install Elixir and Erlang**
   - Download from https://elixir-lang.org/install.html
   - Verify: `elixir --version`

2. **Create Phoenix Project**
   ```
   mix archive.install hex phx_new
   mix phx.new skillswap_api --no-ecto
   cd skillswap_api
   mix deps.get
   ```

3. **Install Dependencies**
   ```
   mix deps.get
   ```

4. **Start Development Server**
   ```
   mix phx.server
   ```
   Server runs on http://localhost:4000

### Key Features Implemented

- **Real-time Communication**: Phoenix Channels for WebSocket support
- **REST APIs**: User, skill, session, credit, and review endpoints
- **Authentication**: JWT token-based auth
- **Matching Algorithm**: Intelligent skill-based matching
- **Session Management**: Virtual and physical session endpoints
- **Credit System**: Credit earning and tracking
- **Reviews & Ratings**: User reputation management
- **QR Code Integration**: Physical meetup verification

### Key Endpoints

```
POST   /api/auth/register        - User registration
POST   /api/auth/login           - User login
GET    /api/users/:id            - Get user profile
PUT    /api/users/:id            - Update profile
POST   /api/skills               - Add skill
GET    /api/skills/search        - Search skills
POST   /api/sessions             - Create session
GET    /api/sessions/:id         - Get session details
POST   /api/sessions/:id/start   - Start session
POST   /api/sessions/:id/end     - End session
POST   /api/reviews              - Add review
GET    /api/credits/:user_id     - Get credits
POST   /api/credits/transfer     - Transfer credits
WS     /socket                   - WebSocket for real-time
```

### Database Schema

```
Users
- uid, email, displayName, profilePicture, bio
- skillsOffered, skillsWanted, credits, reputation
- availabilitySchedule, location, emailVerified

Sessions
- id, teacher, learner, skillTeaching, skillLearning
- sessionType (virtual/physical), status, startTime, endTime
- roomId, qrCode, participants, credits

Reviews
- id, sessionId, reviewerUid, revieweeUid
- rating, comment, skillQuality, communication, punctuality

Credits
- id, userId, amount, reason, timestamp

SafeLocations
- id, name, latitude, longitude, city, category
```

### Deployment

**Render (Free Tier)**
1. Create account at https://render.com
2. Connect GitHub repository
3. Create Web Service
4. Set environment variables
5. Deploy

Environment Variables:
```
PHOENIX_ENVIRONMENT=prod
DATABASE_URL=your_database_url
SECRET_KEY_BASE=generated_secret
CORS_ORIGINS=https://your-frontend.com
```
