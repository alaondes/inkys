import React, { useState } from 'react';
import { Lock, Mail, ExternalLink, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Ocorreu um erro ao fazer login. Certifique-se de que o provedor E-mail/Senha está ativado no Firebase Console.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative" style={{ '--color-primary': 'var(--admin-primary-color, #0891b2)' } as React.CSSProperties}>
      <Link 
        to="/"
        className="mb-4 sm:absolute sm:top-8 sm:right-8 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-medium bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-300 transition-all shadow-sm"
      >
        <ExternalLink size={16} /> Voltar à loja
      </Link>
      
      <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-2xl relative overflow-hidden shadow-xl">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-50" />
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full inline-flex items-center justify-center bg-gray-50 border border-gray-200 mb-4">
            <Lock className="text-[var(--color-primary)]" size={28} />
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-900">Área Restrita</h2>
          <p className="text-gray-500 text-sm mt-2">Faça login para acessar o painel administrativo</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 flex items-start gap-3">
          <AlertTriangle className="text-blue-500 shrink-0" size={20} />
          <div className="text-xs text-blue-800">
            <strong>Atenção:</strong> Você precisa ativar o provedor de autenticação <strong>E-mail/Senha</strong> no Firebase Console (Autenticação {'>'} Sign-in method) e criar um usuário para conseguir fazer login.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                placeholder="seu-email@exemplo.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                placeholder="Sua senha secreta"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-4 py-3 rounded-xl text-white font-bold uppercase tracking-wider transition-all ${loading ? 'bg-gray-400' : 'bg-[var(--color-primary)] hover:brightness-90'}`}
          >
            {loading ? 'Autenticando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}
