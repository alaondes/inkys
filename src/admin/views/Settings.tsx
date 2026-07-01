import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Banknote, Save, MessageCircle } from 'lucide-react';

export function AdminSettings() {
  const [primaryColor, setPrimaryColor] = useState(
    document.documentElement.style.getPropertyValue('--admin-primary-color') || '#00f0ff'
  );

  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  
  const [logoUrl, setLogoUrl] = useState('');
  const [logoMessage, setLogoMessage] = useState('');
  
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');

  const [paymentMethods, setPaymentMethods] = useState({
    pix: true,
    credit: true,
    debit: false,
    boleto: false
  });

  const handleSaveColor = () => {
    document.documentElement.style.setProperty('--admin-primary-color', primaryColor);
    // Also we could save to localStorage
    localStorage.setItem('inkys-admin-primary-color', primaryColor);
    alert('Tema atualizado com sucesso!');
  };

  const handleSaveLogo = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('inkys-logo-url', logoUrl);
    setLogoMessage('Logo atualizado com sucesso!');
    setTimeout(() => setLogoMessage(''), 3000);
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    localStorage.setItem('inkys-admin-password', newPassword);
    setNewPassword('');
    setPasswordMessage('Senha atualizada com sucesso!');
    setTimeout(() => setPasswordMessage(''), 3000);
  };
  
  const handleSaveWhatsapp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappNumber) {
      setWhatsappMessage('Por favor, informe um número válido.');
      return;
    }
    localStorage.setItem('inkys-whatsapp-number', whatsappNumber.replace(/\D/g, ''));
    setWhatsappMessage('Número atualizado com sucesso!');
    setTimeout(() => setWhatsappMessage(''), 3000);
  };

  useEffect(() => {
    const savedColor = localStorage.getItem('inkys-admin-primary-color');
    if (savedColor) {
      setPrimaryColor(savedColor);
    }
    const savedLogo = localStorage.getItem('inkys-logo-url');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
    const savedWhatsapp = localStorage.getItem('inkys-whatsapp-number');
    if (savedWhatsapp) {
      setWhatsappNumber(savedWhatsapp);
    } else {
      setWhatsappNumber('5561991365428');
    }
  }, []);

  return (
    <div className="space-y-8 max-w-4xl">
      <h2 className="text-2xl font-bold uppercase tracking-widest">Configurações</h2>

      {/* Theme Customization */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Logotipo da Loja</h3>
          <p className="text-gray-500 text-sm">Personalize a logo que aparecerá na loja e no painel.</p>
        </div>

        <form onSubmit={handleSaveLogo} className="space-y-4">
          {logoMessage && (
            <div className={`p-3 rounded-lg text-sm font-medium ${logoMessage.includes('sucesso') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {logoMessage}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">URL da Imagem</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none text-gray-900 transition-all"
                  placeholder="https://..."
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Ou faça upload da galeria</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                />
              </div>
            </div>
            
            <div className="w-32 h-32 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
              ) : (
                <div className="w-10 h-10 ink-gradient rounded-full"></div>
              )}
            </div>
          </div>
          
          <button 
            type="submit"
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
          >
            <Save size={18} /> Salvar Logo
          </button>
        </form>
      </div>

      {/* Theme Customization */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Aparência do Painel</h3>
          <p className="text-gray-500 text-sm">Personalize a cor principal de destaque do sistema.</p>
        </div>

        <div className="flex items-center gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div>
            <input 
              type="color" 
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-16 h-16 rounded cursor-pointer bg-transparent border-none appearance-none p-0"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Cor Hexadecimal</label>
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-32 bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none font-mono text-gray-900"
              />
              <button 
                onClick={handleSaveColor}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all"
              >
                <Save size={16} /> Aplicar Cor
              </button>
            </div>
          </div>
          <div className="w-32 h-20 rounded-xl bg-white shadow-sm" style={{ border: `1px solid ${primaryColor}80` }}>
            <div className="p-3">
              <div className="w-1/2 h-2 rounded-full mb-2" style={{ backgroundColor: primaryColor }} />
              <div className="w-3/4 h-2 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Métodos de Pagamento</h3>
          <p className="text-gray-500 text-sm">Ative ou desative as formas de pagamento disponíveis na loja.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <PaymentToggle
            icon={Smartphone}
            title="Pix"
            active={paymentMethods.pix}
            onToggle={() => setPaymentMethods(p => ({...p, pix: !p.pix}))}
          />
          <PaymentToggle
            icon={CreditCard}
            title="Cartão de Crédito"
            active={paymentMethods.credit}
            onToggle={() => setPaymentMethods(p => ({...p, credit: !p.credit}))}
          />
          <PaymentToggle
            icon={CreditCard}
            title="Cartão de Débito"
            active={paymentMethods.debit}
            onToggle={() => setPaymentMethods(p => ({...p, debit: !p.debit}))}
          />
          <PaymentToggle
            icon={Banknote}
            title="Boleto Bancário"
            active={paymentMethods.boleto}
            onToggle={() => setPaymentMethods(p => ({...p, boleto: !p.boleto}))}
          />
        </div>

        <div className="mt-8 p-4 rounded-xl border border-green-200 bg-green-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-900">Gateway de Pagamento Online</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-green-700 bg-green-100 px-2 py-1 rounded">Ativo</span>
        </div>
      </div>

      {/* WhatsApp Configuration */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Integração WhatsApp</h3>
          <p className="text-gray-500 text-sm">Configure o número que receberá os pedidos do catálogo.</p>
        </div>

        <form onSubmit={handleSaveWhatsapp} className="space-y-4 max-w-sm">
          {whatsappMessage && (
            <div className={`p-3 rounded-lg text-sm font-medium ${whatsappMessage.includes('sucesso') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {whatsappMessage}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Número do WhatsApp (com DDD)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-green-500">
                <MessageCircle size={18} />
              </div>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 text-sm focus:border-[var(--color-primary)] outline-none text-gray-900 transition-all"
                placeholder="Ex: 5561991365428"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="flex items-center justify-center gap-2 w-full bg-green-500 text-white px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-green-600 transition-all"
          >
            <Save size={18} /> Salvar Número
          </button>
        </form>
      </div>

      {/* Password Management */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Segurança da Conta</h3>
          <p className="text-gray-500 text-sm">Altere a senha de acesso ao painel administrativo.</p>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-4 max-w-sm">
          {passwordMessage && (
            <div className={`p-3 rounded-lg text-sm font-medium ${passwordMessage.includes('sucesso') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {passwordMessage}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Nova Senha</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none text-gray-900 transition-all"
              placeholder="Digite a nova senha"
            />
          </div>
          <button 
            type="submit"
            className="flex items-center justify-center gap-2 w-full bg-[var(--color-primary)] text-white px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
          >
            <Save size={18} /> Salvar Nova Senha
          </button>
        </form>
      </div>

    </div>
  );
}

function PaymentToggle({ icon: Icon, title, active, onToggle }: { icon: any, title: string, active: boolean, onToggle: () => void }) {
  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
      active ? 'bg-gray-50 border-[var(--color-primary)]' : 'bg-transparent border-gray-200 hover:border-gray-300'
    }`} onClick={onToggle}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-gray-50 text-gray-400'}`}>
          <Icon size={20} />
        </div>
        <span className={`font-medium ${active ? 'text-gray-900' : 'text-gray-500'}`}>{title}</span>
      </div>
      
      {/* Custom Switch */}
      <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${active ? 'left-[22px]' : 'left-[2px]'}`} />
      </div>
    </div>
  );
}
