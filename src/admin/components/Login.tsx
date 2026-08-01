import React, { useState } from 'react';
import { Lock, User, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useSettings } from '../../context/SettingsContext';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { settings } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onLogin();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Ocorreu um erro ao fazer login. Certifique-se de que o provedor E-mail/Senha está ativo no Firebase.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1b5299] bg-gradient-to-b from-[#1c55a0] to-[#0f3a75] flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 font-sans">
      {/* Floating Header Actions */}
      <div className="w-full flex justify-between items-center max-w-7xl mx-auto">
        <Link 
          to="/"
          className="flex items-center gap-2 text-xs text-white/80 hover:text-white font-semibold bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl transition-all border border-white/10 hover:bg-white/20 shadow-sm"
        >
          <ArrowLeft size={14} /> Voltar à loja
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[430px] bg-white rounded-[32px] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-300">
        {/* Header Section */}
        <div className="bg-gradient-to-b from-[#2058a1] to-[#154687] text-center pt-10 pb-8 px-6 sm:px-8 relative">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Portal <span className="text-[#f5a623]">{settings?.storeName || 'Inkys'}</span>
          </h2>
          <p className="text-white/80 text-[11px] sm:text-xs mt-3 max-w-[320px] mx-auto leading-relaxed font-medium">
            Portal Integrado de Monitoramento e Gestão do Governo do Distrito Federal e {settings?.storeName || 'Inkys'}
          </p>
          <div className="w-14 h-1 bg-[#f5a623] mx-auto mt-4 rounded-full shadow-xs" />
        </div>

        {/* Form Section */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold text-center leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Login Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-[#5c728e] font-extrabold ml-1">
                LOGIN
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#154687]" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f0f4fa] border border-[#d1def0] rounded-xl py-3.5 pl-12 pr-4 text-gray-900 placeholder-[#7a95b8] focus:outline-none focus:border-[#2058a1] transition-all text-sm font-medium"
                  placeholder="Digite seu login"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-[#5c728e] font-extrabold ml-1">
                SENHA
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#154687]" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f0f4fa] border border-[#d1def0] rounded-xl py-3.5 pl-12 pr-4 text-gray-900 placeholder-[#7a95b8] focus:outline-none focus:border-[#2058a1] transition-all text-sm font-medium"
                  placeholder="......."
                />
              </div>
            </div>

            {/* Access Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold uppercase tracking-widest text-xs transition-all shadow-md active:scale-[0.99] ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#2b6cb0] hover:bg-[#1d5091] hover:shadow-lg'
              }`}
            >
              {loading ? 'Autenticando...' : 'Acessar'}
            </button>
          </form>

          {/* Alert / Notice for initial setups */}
          <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <p className="text-[10px] text-amber-800 leading-normal font-medium">
              Nota: Certifique-se de usar uma conta com privilégios cadastrada ou criada no Firestore para fazer login.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="w-full text-center py-4 text-white/50 space-y-1.5 text-[10px] sm:text-xs leading-relaxed max-w-2xl mx-auto font-medium">
        <p className="uppercase tracking-wider font-semibold text-white/70 text-[11px]">
          Governo do Distrito Federal & {settings?.storeName || 'Inkys'}
        </p>
        <p className="opacity-90">
          Secretaria de Estado de Economia • Secretaria Executiva de Gestão da Estratégia
        </p>
        <p className="opacity-85">
          Subsecretaria de Gestão de Programas e Projetos Estratégicos • SUPPE
        </p>
        <p className="opacity-80">
          Unidade de Gestão Estratégica de Dados, Informações e Comunicação • UGEDIC
        </p>
        <p className="opacity-70 text-[9px] sm:text-[10px]">
          Plataforma de Gestão Integrada desenvolvida para {settings?.storeName || 'inkys.com.br'} • CEP: 70.620-080
        </p>
      </footer>
    </div>
  );
}

