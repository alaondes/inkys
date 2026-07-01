import React, { useState } from 'react';
import { Lock, Mail, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storedPassword = localStorage.getItem('inkys-admin-password') || 'InkysAdmin2026!';
    
    if (email === 'admin@inkys.com' && password === storedPassword) {
      onLogin();
    } else {
      setError('Credenciais inválidas. Tente: admin@inkys.com e sua senha (padrão: InkysAdmin2026!)');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Link 
        to="/"
        className="absolute top-8 right-8 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-medium bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-300 transition-all shadow-sm"
      >
        <ExternalLink size={16} /> Voltar à loja
      </Link>
      
      <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-2xl relative overflow-hidden shadow-xl">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full inline-flex items-center justify-center bg-gray-50 border border-gray-200 mb-4">
            <Lock className="text-cyan-600" size={28} />
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-900">Área Restrita</h2>
          <p className="text-gray-500 text-sm mt-2">Faça login para acessar o painel administrativo</p>
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
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 focus:outline-none focus:border-cyan-500 transition-all"
                placeholder="admin@inkys.com"
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
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 focus:outline-none focus:border-cyan-500 transition-all"
                placeholder="InkysAdmin2026!"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-3 rounded-xl bg-cyan-500 text-white font-bold uppercase tracking-wider hover:bg-cyan-600 transition-all"
          >
            Entrar no Painel
          </button>
        </form>
      </div>
    </div>
  );
}
