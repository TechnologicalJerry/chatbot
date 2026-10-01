'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { KeyRound, Mail, User as UserIcon, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [tier, setTier] = useState('free');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegisterMode) {
        await register(email, password, name, tier);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isRegisterMode ? 'Create Account' : 'Sign In'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-rose-300 bg-rose-950/80 border border-rose-800/80 rounded-xl">
            {error}
          </div>
        )}

        {isRegisterMode && (
          <div>
            <label className="block mb-1.5 text-xs font-medium text-slate-300">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full py-2.5 pl-10 pr-4 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block mb-1.5 text-xs font-medium text-slate-300">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full py-2.5 pl-10 pr-4 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1.5 text-xs font-medium text-slate-300">Password</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full py-2.5 pl-10 pr-4 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {isRegisterMode && (
          <div>
            <label className="block mb-1.5 text-xs font-medium text-slate-300">Quota Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full py-2.5 px-3 text-sm text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-500"
            >
              <option value="free">Free (100 req/day)</option>
              <option value="pro">Pro (5,000 req/day)</option>
              <option value="enterprise">Enterprise (50,000 req/day)</option>
            </select>
          </div>
        )}

        <div className="pt-2">
          <Button type="submit" isLoading={loading} className="w-full py-3">
            <Sparkles className="w-4 h-4 mr-2" />
            {isRegisterMode ? 'Register' : 'Sign In'}
          </Button>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError(null);
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
