import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks';
import { useAuthStore } from './store';
import { logoutUser } from './services/authService';

// Pages
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import SkillsPage from './pages/SkillsPage';
import FindMatchesPage from './pages/FindMatchesPage';
import SessionsPage from './pages/SessionsPage';
import SessionDetailPage from './pages/SessionDetailPage';
import ProfilePage from './pages/ProfilePage';

// Components
import Layout from './components/Layout';
import Logo from './components/Logo';

// Styles
import './styles/globals.css';

function App() {
  const { loading } = useAuth();
  const { user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsInitialized(true);
    }
  }, [loading]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 to-accent-500">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="xl" showText={false} />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">SkillSwap Africa</h1>
          <p className="text-xl text-primary-100">Loading your platform...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout');
    }
  };

  return (
    <Router>
      {!user ? (
        <AuthPage />
      ) : (
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/find-matches" element={<FindMatchesPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
}

export default App;
