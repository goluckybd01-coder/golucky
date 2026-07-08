import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Lock, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const GameAdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Login failed');
      }

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id);

      if (rolesError) throw rolesError;

      const hasAccess = roles?.some(
        r => r.role === 'game_admin' || r.role === 'super_admin'
      );

      if (!hasAccess) {
        await supabase.auth.signOut();
        toast.error('Access Denied', {
          description: 'You do not have Game Admin privileges.',
        });
        setIsLoading(false);
        return;
      }

      toast.success('Login Successful!', {
        description: 'Welcome to Game Admin Panel',
      });

      navigate('/game-admin');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login Failed', {
        description: error.message || 'Invalid credentials',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur-xl opacity-30" />

        <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-4"
            >
              <Gamepad2 className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">Game Admin Panel</h1>
            <p className="text-white/70 text-sm mt-1">Secure access to game management</p>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-400" />
                Admin Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-400" />
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Gamepad2 className="h-5 w-5 mr-2" />
                  Access Game Panel
                </>
              )}
            </Button>

            <p className="text-center text-xs text-gray-500">
              🔒 This area is restricted to authorized Game Administrators only
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default GameAdminLogin;
