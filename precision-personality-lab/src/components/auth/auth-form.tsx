'use client';

import { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/auth-context';

// ✅ Updated import — lazy-loaded motion components
import { MotionDiv } from '@/lib/lazy-motion';

export function AuthForm() {
  const { signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (mode === 'signin') {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#4A8FFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* ✅ motion.div → MotionDiv */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          {/* ✅ inner motion.div → MotionDiv */}
          <MotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl gradient-precision ambient-glow-hero"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </MotionDiv>

          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="gradient-text-precision">
              Precision + Personality Lab
            </span>
          </h1>
          <p className="text-gray-400">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#4A8FFF] focus:ring-2 focus:ring-[#4A8FFF]/20 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#4A8FFF] focus:ring-2 focus:ring-[#4A8FFF]/20 transition-all"
                placeholder="••••••••"
              />
              {mode === 'signup' && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {mode === 'signin' ? (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <span className="text-[#4A8FFF] font-semibold">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span className="text-[#4A8FFF] font-semibold">Sign in</span>
                </>
              )}
            </button>
          </div>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Master your model&apos;s mind, control the precision, calibrate the
            creativity
          </p>
        </div>
      </MotionDiv>
    </div>
  );
}
