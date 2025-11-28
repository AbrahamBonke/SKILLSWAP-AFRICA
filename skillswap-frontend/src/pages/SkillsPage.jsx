import { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { getUserProfile, addSkillOffered, addSkillWanted, updateUserProfile } from '../services/authService';

export default function SkillsPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [newSkill, setNewSkill] = useState('');
  const [skillType, setSkillType] = useState('offered');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const profileData = await getUserProfile(user.uid);
      setProfile(profileData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    try {
      if (skillType === 'offered') {
        await addSkillOffered(user.uid, newSkill);
      } else {
        await addSkillWanted(user.uid, newSkill);
      }
      setNewSkill('');
      await loadProfile();
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 py-8 px-4 md:px-0">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary-900 mb-2">🎓 Manage Your Skills</h1>
        <p className="text-gray-600 mb-8">Add skills you can teach and skills you want to learn</p>

        {/* Add Skill Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-primary-900 mb-6">Add New Skill</h2>
          <form onSubmit={handleAddSkill} className="flex gap-4 flex-col md:flex-row">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="e.g., Python, Guitar, Video Editing..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <select
              value={skillType}
              onChange={(e) => setSkillType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="offered">I Can Teach</option>
              <option value="wanted">I Want to Learn</option>
            </select>
            <button
              type="submit"
              className="px-6 py-3 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600 transition whitespace-nowrap"
            >
              Add Skill
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Skills I Can Teach */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-primary-900 mb-4">📚 Skills I Can Teach</h2>
            <div className="space-y-3">
              {profile?.skillsOffered && profile.skillsOffered.length > 0 ? (
                profile.skillsOffered.map((skill) => (
                  <div
                    key={skill.id}
                    className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-primary-900">{skill.name}</p>
                        {skill.verified && (
                          <p className="text-xs text-green-600">✓ Verified</p>
                        )}
                      </div>
                      <span className="text-2xl">🎓</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No skills added yet</p>
              )}
            </div>
          </div>

          {/* Skills I Want to Learn */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-primary-900 mb-4">📖 Skills I Want to Learn</h2>
            <div className="space-y-3">
              {profile?.skillsWanted && profile.skillsWanted.length > 0 ? (
                profile.skillsWanted.map((skill) => (
                  <div
                    key={skill.id}
                    className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-orange-900">{skill.name}</p>
                        <p className="text-xs text-orange-600">Priority: {skill.priority}</p>
                      </div>
                      <span className="text-2xl">🚀</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No skills added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
