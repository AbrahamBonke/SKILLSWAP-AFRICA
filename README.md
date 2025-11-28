# SkillSwap Africa

**A peer-to-peer skill exchange platform empowering communities through affordable skill-sharing.**

---

## Overview

SkillSwap Africa is a production-ready web application that enables users to exchange skills without monetary transactions. Using an in-app credit system, users teach skills they excel at and learn skills they want to master—creating a sustainable, community-driven learning ecosystem.

The platform combines browser-based virtual learning (WebRTC with video and screen sharing) with physical meetups in pre-approved locations, ensuring trust and accessibility across devices.

## Core Features

- **User Authentication**: Secure email-based registration with verification
- **Skill Management**: List skills you teach and skills you want to learn
- **Smart Matching**: Intelligent algorithm matches users based on mutual skills
- **Virtual Sessions**: Real-time peer-to-peer video calls with screen sharing (WebRTC)
- **Physical Sessions**: Safe meetup locations with QR code verification
- **Credit System**: +1 credit for teaching, -1 for learning; real-time balance tracking
- **Reviews & Reputation**: Build trust through ratings and user verification
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | Modern, fast UI development |
| Styling | Tailwind CSS | Utility-first responsive design |
| State Management | Zustand | Lightweight state management |
| Real-time Communication | WebRTC | Peer-to-peer video calls |
| Backend Database | Firebase Firestore | Serverless real-time database |
| Authentication | Firebase Auth | Secure user authentication |
| Deployment | Netlify/Vercel | Frontend hosting |

## Getting Started

### Prerequisites

- Node.js v16+ and npm v7+
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   cd skillswap-frontend
   npm install
   ```

2. **Configure Firebase**
   - Go to [Firebase Console](https://firebase.google.com)
   - Create a new project named `skillswap-africa`
   - Enable Email/Password authentication
   - Create Firestore database in production mode
   - Copy credentials to `src/services/firebase.js`

3. **Start the development server**
   ```bash
   npm run dev
   ```
   - Opens at `http://localhost:5173`

### First Steps

1. Register an account
2. Complete your profile with skills you can teach
3. Add skills you want to learn
4. Use "Find Matches" to discover potential skill partners
5. Book a session and start learning!

## Project Structure

```
skillswap-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components (Auth, Dashboard, Skills, etc.)
│   ├── services/           # Firebase and API services
│   ├── store/              # Zustand state management
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── styles/             # Global CSS
│   ├── App.jsx             # Root component
│   └── main.jsx            # Entry point
├── public/                 # Static assets
├── package.json            # Dependencies
└── vite.config.js         # Vite configuration
```

## Key Components

### VideoCallComponent.jsx
Implements WebRTC peer-to-peer video calling with:
- Camera and microphone access
- Screen sharing capability
- Connection state management
- Proper resource cleanup

### SkillMatching Algorithm
Scores compatibility based on:
- Mutual skill offerings (skill A teaches, user B learns)
- Location proximity (optional)
- Availability compatibility

### Credit System
- Teaching a session: +1 credit
- Learning a session: -1 credit
- Real-time balance updates
- Transaction history tracking

## Deployment

### Frontend Deployment (Netlify)

```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Production Configuration

1. Update Firebase config with production credentials
2. Set environment variables for API keys
3. Configure TURN servers for WebRTC reliability
4. Enable analytics and monitoring

## Troubleshooting

### Common Issues

**Camera/Microphone Permission Denied**
- Check browser permissions (Settings → Privacy → Camera/Microphone)
- Allow the website access when prompted
- Use HTTPS (required in production)

**WebRTC Connection Fails**
- Verify STUN/TURN server configuration
- Check network connectivity
- Test with Chrome DevTools (`chrome://webrtc-internals/`)

**Firebase Errors**
- Verify Firebase config in `src/services/firebase.js`
- Check Firestore security rules are published
- Ensure collections exist: users, sessions, reviews, creditTransactions

See **Toolkit Document.md** for detailed troubleshooting guide.

## Documentation

- **Toolkit Document.md** - Complete technical guide with setup, examples, and solutions
- **SETUP_GUIDE.md** - Detailed installation instructions
- **FIREBASE_SETUP.md** - Firebase configuration walkthrough
- **QUICK_START.md** - 5-minute quickstart

## Security & Privacy

- Users authenticate with verified email addresses
- Firestore security rules restrict data access
- No direct address sharing (physical meetups at pre-approved locations only)
- Optional GPS verification for physical sessions
- Reputation system builds trust through reviews

## Learning Outcomes

This capstone project demonstrates mastery of:

- **WebRTC Protocol**: Peer connection establishment, SDP negotiation, ICE candidate handling
- **React Development**: Component architecture, hooks, state management
- **Firebase Integration**: Real-time database, authentication, security rules
- **Full-Stack Development**: From UI components to real-time protocol implementation

## License

This project is provided as-is for educational and community use.

## Support

For detailed technical guidance:
1. Refer to **Toolkit Document.md** for comprehensive troubleshooting
2. Check [Firebase Documentation](https://firebase.google.com/docs)
3. Review [WebRTC MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
4. Browse [React Documentation](https://react.dev)

## Vision

SkillSwap Africa embodies the PhoenixTech Elevate philosophy: **lifting communities through skill empowerment, making learning accessible, safe, and impactful.**

**Exchange Skills. Unlock Potential. 🔥**

---

**Status**: ✅ Production Ready  
**Version**: 1.0 MVP  
**Last Updated**: November 2025
