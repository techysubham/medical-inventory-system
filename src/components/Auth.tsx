import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Lock, Mail } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-blue-300 to-cyan-300 opacity-20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-gradient-to-br from-purple-300 to-pink-300 opacity-20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card overflow-hidden shadow-glossy-lg">
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center justify-center mb-8">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-600 rounded-2xl opacity-75 blur-lg animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-glossy">
                  <Heart className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-center mb-2 text-gradient bg-gradient-to-r from-blue-600 to-teal-600">
              Medical Inventory Pro
            </h1>
            <p className="text-gray-600 text-center mb-8 text-lg">
              Sign in to your account
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 transition-all group-focus-within:scale-110" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-modern pl-12"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 transition-all group-focus-within:scale-110" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-modern pl-12"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="glass-card border-l-4 border-red-500 bg-red-50/50 p-4 text-red-700 text-sm font-medium">
                  <p className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-glossy w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white font-bold py-4 text-lg hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-glossy-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          <div className="px-8 py-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 border-t border-white/30">
            <p className="text-center text-sm text-gray-600 font-medium">
              💡 Contact your administrator for account access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
