import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { getUserSessions } from '../services/sessionService';
import { getSessionReview } from '../services/reviewService';
import { formatDate, formatTime } from '../utils/helpers';

export default function SessionsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [reviewedSessions, setReviewedSessions] = useState({});

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    try {
      const userSessions = await getUserSessions(user.uid);
      setSessions(userSessions);
      
      // Check which completed sessions have been reviewed
      const reviewed = {};
      for (const session of userSessions) {
        if (session.status === 'completed') {
          const review = await getSessionReview(session.id, user.uid);
          if (review) {
            reviewed[session.id] = true;
          }
        }
      }
      setReviewedSessions(reviewed);
      setLoading(false);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 py-8 px-4 md:px-0">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-primary-900 mb-2">📅 Your Sessions</h1>
        <p className="text-gray-600 mb-8">Manage your teaching and learning sessions</p>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['all', 'pending', 'active', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-500'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600">No sessions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map(session => (
              <div
                key={session.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-primary-900">
                      {session.skillTeaching || 'Skill Session'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {session.sessionType === 'virtual' ? '💻 Virtual' : '📍 Physical'} Session
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-lg font-semibold ${getStatusBadge(session.status)}`}>
                    {session.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Created</p>
                    <p className="text-sm font-medium">{formatDate(session.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Type</p>
                    <p className="text-sm font-medium">{session.sessionType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Credits</p>
                    <p className="text-sm font-medium">±{session.credits}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Duration</p>
                    <p className="text-sm font-medium">{session.duration ? `${session.duration}m` : 'Pending'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {session.status === 'pending' && (
                    <>
                      <Link
                        to={`/sessions/${session.id}`}
                        className="flex-1 px-4 py-2 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600 transition text-center"
                      >
                        Join Session
                      </Link>
                      <button className="px-4 py-2 border border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition">
                        Cancel
                      </button>
                    </>
                  )}
                  {session.status === 'active' && (
                    <Link
                      to={`/sessions/${session.id}`}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition text-center"
                    >
                      Continue Session
                    </Link>
                  )}
                  {session.status === 'completed' && (
                    <button 
                      onClick={() => navigate(`/sessions/${session.id}`)}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                        reviewedSessions[session.id] 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      {reviewedSessions[session.id] ? '✓ Change Review' : 'Leave Review'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
