import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Login } from './Login';

export function LoginRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#1b5299] bg-gradient-to-b from-[#1c55a0] to-[#0f3a75] font-bold text-white/50">
        Carregando...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <Login onLogin={() => navigate('/admin')} />;
}
