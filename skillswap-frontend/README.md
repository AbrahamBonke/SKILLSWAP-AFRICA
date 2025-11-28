# SkillSwap Africa - Frontend

React + Vite frontend for the SkillSwap skill-sharing platform.

## Quick Start

```bash
# Install dependencies
npm install

# Add logo file
cp ../Untitled\ \(4\).png ./public/logo.png

# Start dev server
npm run dev
```

Visit `http://localhost:5173`

## Setup

1. Create `.env.local` with Firebase config (see main README)
2. Run `npm install`
3. Run `npm run dev`

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Tech Stack

- **React 18** - UI framework
- **Vite 5** - Build tool
- **Firebase** - Backend
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router v6** - Navigation
- **WebRTC** - Video calls

## Folder Structure

```
src/
├── components/   - Reusable components
├── pages/       - Page components
├── services/    - Firebase & API services
├── store/       - Zustand stores
├── styles/      - CSS & Tailwind config
├── utils/       - Helper functions
├── App.jsx      - Root component
└── main.jsx     - Entry point
```
