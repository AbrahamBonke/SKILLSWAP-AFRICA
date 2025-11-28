import { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { matchUsers, createMatchSession } from '../services/matchingService';
import { getUserCredits } from '../services/creditService';
import { formatDate } from '../utils/helpers';

export default function FindMatchesPage() {
   const { user } = useAuthStore();
   const [matches, setMatches] = useState([]);
   const [loading, setLoading] = useState(false);
   const [selectedMatch, setSelectedMatch] = useState(null);
   const [bookingModalOpen, setBookingModalOpen] = useState(false);
   const [sessionType, setSessionType] = useState('virtual');
   const [physicalLocation, setPhysicalLocation] = useState('');
   const [userRole, setUserRole] = useState(null); // 'teaching' or 'learning'
   const [roleSelectionOnly, setRoleSelectionOnly] = useState(false); // flag to show role-selection screen first
   const [selectedSkill, setSelectedSkill] = useState(null); // selected skill to teach or learn
   const [userCredits, setUserCredits] = useState(0);

   useEffect(() => {
     if (user) {
       findMatches();
       loadUserCredits();
     }
   }, [user]);

   const loadUserCredits = async () => {
     try {
       const credits = await getUserCredits(user.uid);
       setUserCredits(credits);
     } catch (error) {
       console.error('Error loading credits:', error);
     }
   };

  const findMatches = async () => {
    setLoading(true);
    try {
      const potentialMatches = await matchUsers(user.uid);
      setMatches(potentialMatches);
    } catch (error) {
      console.error('Error finding matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (matchId) => {
    // Open booking modal for the selected match
    const match = matches.find(m => m.id === matchId);
    setSelectedMatch(match);
    setSessionType('virtual');
    setPhysicalLocation('');
    setUserRole(null);
    setSelectedSkill(null);
    setRoleSelectionOnly(true);
    setBookingModalOpen(true);
  };

  const confirmBooking = async () => {
    if (!selectedMatch) return;
    if (!userRole) {
      alert('Please select your role (teaching or learning)');
      return;
    }
    if (!selectedSkill) {
      alert('Please select a skill');
      return;
    }

    try {
      // Check credits if user is learning
      if (userRole === 'learning') {
        const userCredits = await getUserCredits(user.uid);
        if (userCredits <= 0) {
          alert('You cannot learn with 0 credits. Please teach a skill first to earn credits. Credits are the currency to learn from others.');
          return;
        }
      }

      let skillToTeach, skillToLearn;

      if (userRole === 'teaching') {
        // Current user teaches, match learns
        skillToTeach = selectedSkill;
        skillToLearn = selectedMatch.skillsWanted?.find(s => s.name === selectedSkill)?.name || selectedSkill;
      } else {
        // Current user learns, match teaches
        skillToTeach = selectedSkill;
        skillToLearn = user.skillsWanted?.find(s => s.name === selectedSkill)?.name || selectedSkill;
      }

      const sessionId = await createMatchSession(
        userRole === 'teaching' ? user.uid : selectedMatch.id,
        userRole === 'teaching' ? selectedMatch.id : user.uid,
        skillToTeach,
        skillToLearn,
        {
          sessionType,
          location: sessionType === 'physical' ? physicalLocation || selectedMatch.location || null : null
        }
      );

      setBookingModalOpen(false);
      // Redirect to the new session page
      window.location.href = `/sessions/${sessionId}`;
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Could not create session: ' + (error.message || error));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 py-8 px-4 md:px-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary-900">🤝 Find Your Match</h1>
            <p className="text-gray-600">Connect with people who have skills you want to learn</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-sm text-gray-600">Your Credits</div>
              <div className={`text-3xl font-bold ${userCredits === 0 ? 'text-red-600' : 'text-green-600'}`}>
                {userCredits}
              </div>
              {userCredits === 0 && (
                <div className="text-xs text-red-600 mt-2">Teach to earn credits</div>
              )}
            </div>
            <button
              onClick={findMatches}
              disabled={loading}
              className="px-6 py-3 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600 transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Find Matches'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Finding perfect matches for you...</p>
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No matches found yet</p>
            <p className="text-gray-500 text-sm">Add more skills to find better matches</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:scale-105"
            >
              <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-24"></div>

              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary-900">{match.displayName}</h3>
                    <p className="text-sm text-gray-600">Match Score: {match.matchScore}%</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">{match.bio || 'No bio added'}</p>
                </div>

                <div className="mb-6 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Can Teach</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {match.skillsOffered?.slice(0, 2).map((skill) => (
                        <span
                          key={skill.id}
                          className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Wants to Learn</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {match.skillsWanted?.slice(0, 2).map((skill) => (
                        <span
                          key={skill.id}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMatch(match)}
                    className="flex-1 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => handleStartSession(match.id)}
                    className="flex-1 px-4 py-2 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600 transition"
                  >
                    Book Session
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Booking modal */}
        {bookingModalOpen && selectedMatch && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            {roleSelectionOnly ? (
              // Role selection screen
              <div className="bg-white rounded-lg p-6 w-full max-w-xl">
                <h3 className="text-xl font-bold mb-4">What would you like to do?</h3>
                <p className="text-sm text-gray-600 mb-6">Choose if you want to teach or learn in this session with {selectedMatch.displayName}.</p>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => { setUserRole('teaching'); setSelectedSkill(null); setRoleSelectionOnly(false); }}
                    className="w-full p-4 border-2 border-accent-500 rounded-lg hover:bg-accent-50 transition text-left"
                  >
                    <div className="font-semibold text-accent-600">🎓 I'm Teaching</div>
                    <div className="text-sm text-gray-600">I will teach {selectedMatch.displayName} a skill</div>
                  </button>

                  <button
                    onClick={() => { 
                      if (userCredits <= 0) {
                        alert('You need credits to learn! Please teach a skill first to earn credits. Each completed teaching session earns you 1 credit.');
                        return;
                      }
                      setUserRole('learning'); 
                      setSelectedSkill(null); 
                      setRoleSelectionOnly(false); 
                    }}
                    disabled={userCredits <= 0}
                    className={`w-full p-4 border-2 rounded-lg transition text-left ${
                      userCredits <= 0
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
                        : 'border-primary-500 hover:bg-primary-50'
                    }`}
                  >
                    <div className={`font-semibold ${userCredits <= 0 ? 'text-gray-500' : 'text-primary-600'}`}>
                      📚 I'm Learning
                    </div>
                    <div className="text-sm text-gray-600">I will learn from {selectedMatch.displayName}</div>
                    {userCredits <= 0 && (
                      <div className="text-xs text-red-600 mt-2 font-semibold">Requires credits (you have {userCredits})</div>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setBookingModalOpen(false)}
                  className="w-full px-4 py-2 border rounded text-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : userRole && !selectedSkill ? (
              // Skill selection screen
              <div className="bg-white rounded-lg p-6 w-full max-w-xl">
                <h3 className="text-xl font-bold mb-2">Select a Skill</h3>
                <p className="text-sm text-gray-600 mb-6">
                  {userRole === 'teaching' 
                    ? `Choose a skill you will teach ${selectedMatch.displayName}`
                    : `Choose a skill you want to learn from ${selectedMatch.displayName}`
                  }
                </p>

                <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                  {userRole === 'teaching' ? (
                    user.skillsOffered && user.skillsOffered.length > 0 ? (
                      user.skillsOffered.map((skill) => (
                        <button
                          key={skill.id}
                          onClick={() => setSelectedSkill(skill.name)}
                          className="w-full p-3 text-left border-2 border-gray-200 rounded-lg hover:border-accent-500 hover:bg-accent-50 transition"
                        >
                          <div className="font-semibold text-gray-900">{skill.name}</div>
                          <div className="text-xs text-gray-500">Teaching skill</div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg text-gray-600 text-sm">
                        You haven't added any skills to teach yet. <a href="/skills" className="text-accent-600 underline">Add skills first</a>
                      </div>
                    )
                  ) : (
                    selectedMatch.skillsOffered && selectedMatch.skillsOffered.length > 0 ? (
                      selectedMatch.skillsOffered.map((skill) => (
                        <button
                          key={skill.id}
                          onClick={() => setSelectedSkill(skill.name)}
                          className="w-full p-3 text-left border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
                        >
                          <div className="font-semibold text-gray-900">{skill.name}</div>
                          <div className="text-xs text-gray-500">{selectedMatch.displayName} can teach this</div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg text-gray-600 text-sm">
                        {selectedMatch.displayName} hasn't added any teaching skills yet.
                      </div>
                    )
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setUserRole(null); setSelectedSkill(null); }}
                    className="flex-1 px-4 py-2 border rounded text-gray-600"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => selectedSkill && setRoleSelectionOnly(false)}
                    disabled={!selectedSkill}
                    className="flex-1 px-4 py-2 bg-accent-500 text-white rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              // Session details screen
              <div className="bg-white rounded-lg p-6 w-full max-w-xl">
                <h3 className="text-xl font-bold mb-2">Book a session with {selectedMatch.displayName}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  You are {userRole === 'teaching' ? '🎓 teaching' : '📚 learning'} <strong>{selectedSkill}</strong>. Choose session type and confirm.
                </p>

                <div className="mb-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="stype" value="virtual" checked={sessionType === 'virtual'} onChange={() => setSessionType('virtual')} />
                    <span className="ml-2">Virtual (default)</span>
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input type="radio" name="stype" value="physical" checked={sessionType === 'physical'} onChange={() => setSessionType('physical')} />
                    <span className="ml-2">Physical (in-person)</span>
                  </label>
                </div>

                {sessionType === 'physical' && (
                  <div className="mb-4">
                    <label className="text-sm text-gray-600">Physical meeting place (address or venue)</label>
                    <input value={physicalLocation} onChange={(e) => setPhysicalLocation(e.target.value)} className="w-full mt-2 p-2 border rounded" placeholder="e.g. Central Library, Nairobi" />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button onClick={() => setSelectedSkill(null)} className="px-4 py-2 border rounded">Back</button>
                  <button onClick={confirmBooking} className="px-4 py-2 bg-accent-500 text-white rounded">Confirm Booking</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
