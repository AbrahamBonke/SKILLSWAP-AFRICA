import { useState } from 'react';
import RegisterForm from '../components/RegisterForm';
import LoginForm from '../components/LoginForm';
import Logo from '../components/Logo';
import { signInWithGoogle } from '../services/authService';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Google sign-in error:', err);
      alert('Google sign-in failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-accent-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="text-4xl font-bold text-primary-900 mb-2">SkillSwap</h1>
            <p className="text-gray-600">Exchange Skills, Unlock Potential</p>
            <p className="text-sm text-gray-500 mt-2">Powered by PhoenixTech Elevate</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                isLogin
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                !isLogin
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Register
            </button>
          </div>

          <div className="mb-4 flex justify-center">
            <button
              onClick={handleGoogle}
              className="flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-lg bg-white hover:shadow transition"
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

          {isLogin ? (
            <LoginForm onSuccess={() => window.location.href = '/dashboard'} />
          ) : (
            <RegisterForm onSuccess={() => setIsLogin(true)} />
          )}

          <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-xs text-gray-600">
              🌍 <strong>SkillSwap Africa</strong> empowers communities through peer-to-peer skill sharing.
              Learn, teach, and build reputation without monetary transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
