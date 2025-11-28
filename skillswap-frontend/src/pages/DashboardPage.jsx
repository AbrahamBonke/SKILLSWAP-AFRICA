import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore, useCreditStore } from '../store';
import { getUserProfile } from '../services/authService';
import { getCreditHistory } from '../services/creditService';
import { getUserSessions } from '../services/sessionService';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { credits } = useCreditStore();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    sessionsCompleted: 0,
    creditsEarned: 0,
    reputation: 0,
    totalTeaching: 0,
    totalLearning: 0
  });
  const { setCreditHistory } = useCreditStore();
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const profileData = await getUserProfile(user.uid);
      setProfile(profileData);
      setStats({
        sessionsCompleted: (profileData?.totalSessionsTeaching || 0) + (profileData?.totalSessionsLearning || 0),
        creditsEarned: profileData?.credits || 0,
        reputation: profileData?.reputation || 'Unrated',
        totalTeaching: profileData?.totalSessionsTeaching || 0,
        totalLearning: profileData?.totalSessionsLearning || 0
      });
      // load recent activity from real data
      try {
        const history = await getCreditHistory(user.uid);
        setCreditHistory(history || []);
        const sessions = await getUserSessions(user.uid);
        const recent = [];
        (history || []).slice(0, 4).forEach(h => recent.push({ type: 'credit', ...h }));
        (sessions || []).slice(0, 4).forEach(s => recent.push({ type: 'session', ...s }));
        // sort by timestamp/createdAt desc
        recent.sort((a, b) => {
          const ta = a.timestamp ? new Date(a.timestamp).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const tb = b.timestamp ? new Date(b.timestamp).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return tb - ta;
        });
        setRecentActivity(recent.slice(0, 6));
      } catch (e) {
        console.error('Failed loading recent activity', e);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 py-8 px-4 md:px-0">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.displayName}! 👋</h1>
          <p className="text-primary-100">Let's exchange skills and build our community together</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 border-t-4 border-accent-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Credits Balance</p>
                <p className="text-3xl font-bold text-primary-900">{stats.creditsEarned}</p>
              </div>
              <span className="text-4xl">💰</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-t-4 border-primary-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Sessions</p>
                <p className="text-3xl font-bold text-primary-900">{stats.sessionsCompleted}</p>
                <p className="text-xs text-gray-500 mt-1">Teaching: {stats.totalTeaching} | Learning: {stats.totalLearning}</p>
              </div>
              <span className="text-4xl">📅</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-t-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Reputation</p>
                <p className="text-3xl font-bold text-primary-900">{stats.reputation}</p>
              </div>
              <span className="text-4xl">⭐</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rating</p>
                <p className="text-3xl font-bold text-primary-900">{profile?.averageRating || 0}/5</p>
              </div>
              <span className="text-4xl">🎯</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-4">🎓 Teach a Skill</h2>
            <p className="text-gray-600 mb-6">Share your expertise and earn credits by teaching others</p>
            <Link
              to="/skills"
              className="inline-block px-6 py-3 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600 transition"
            >
              Add Skills You Teach
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-4">📚 Learn a Skill</h2>
            <p className="text-gray-600 mb-6">Find experts and learn skills that interest you</p>
            <Link
              to="/find-matches"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Find Matches
            </Link>
          </div>
        </div>

        {/* Recent Activity (real data) */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-primary-900 mb-6">📈 Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-gray-600">No recent activity</p>
            ) : (
              recentActivity.map((item, idx) => (
                <div key={idx} className={`flex items-center justify-between p-4 border-l-4 rounded ${item.type === 'credit' ? (item.amount > 0 ? 'border-primary-500 bg-primary-50' : 'border-accent-500 bg-orange-50') : 'border-gray-200 bg-white'}`}>
                  <div>
                    <p className="font-semibold text-gray-900">{item.type === 'credit' ? (item.reason || 'Credit transaction') : (item.skillTeaching || 'Session')}</p>
                    <p className="text-sm text-gray-600">{item.type === 'credit' ? new Date(item.timestamp).toLocaleString() : (item.createdAt ? new Date(item.createdAt).toLocaleString() : '')}</p>
                  </div>
                  <span className="text-lg">{item.type === 'credit' ? (item.amount > 0 ? `+${item.amount}` : `${item.amount}`) : (item.credits ? `±${item.credits}` : '')}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
