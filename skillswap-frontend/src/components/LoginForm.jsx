import { useState } from 'react';
import { loginUser, signInWithGoogle } from '../services/authService';
import ForgotPasswordModal from './ForgotPasswordModal';

export default function LoginForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(formData.email, formData.password);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
          >
            Forgot?
          </button>
        </div>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2 border border-gray-200 rounded-lg bg-white hover:shadow transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285f4" d="M533.5 278.4c0-18.5-1.6-37-4.8-54.7H272v103.4h147.1c-6.4 34.9-25.8 64.4-55 84.2v69h88.8c52-48 81.6-118.3 81.6-201.9z"/>
            <path fill="#34a853" d="M272 544.3c73.7 0 135.6-24.3 180.8-66l-88.8-69c-24.7 16.6-56.4 26.5-92 26.5-70.8 0-130.9-47.7-152.4-111.6H28.2v70.1C73.5 489.9 166.2 544.3 272 544.3z"/>
            <path fill="#fbbc04" d="M119.6 328.2c-10.9-32.1-10.9-66.9 0-99 0 0-0.1-0.1 0-0.1l-91.4-70.1C9.9 199.8 0 236.8 0 272c0 35.3 9.9 72.2 28.2 103.9l91.4-70.1z"/>
            <path fill="#ea4335" d="M272 107.6c39.9-0.6 78.2 14 107.5 40.4l80.6-80.6C404.7 24.1 345.5 0 272 0 166.2 0 73.5 54.4 28.2 141.3l91.4 70.1C141.1 155.3 201.2 107.6 272 107.6z"/>
          </svg>
          <span className="text-sm">Continue with Google</span>
        </button>
      </div>

      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </form>
  );
}
