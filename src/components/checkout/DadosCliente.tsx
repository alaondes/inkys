import React, { useEffect } from 'react';
import { maskCPF, maskPhone, maskDate, maskCEP } from '../../utils/validation';
import { Search } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface DadosClienteProps {
  formData: any;
  setFormData: any;
  errors: any;
  setErrors: any;
  birthDate: string;
  setBirthDate: any;
  landline: string;
  setLandline: any;
  handleCepChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cepLoading: boolean;
  selectedShipping: number;
  setSelectedShipping: any;
  cartTotal: number;
}

export function DadosCliente({
  formData, setFormData, errors, setErrors, 
  birthDate, setBirthDate, landline, setLandline,
  handleCepChange, cepLoading, selectedShipping, setSelectedShipping,
  cartTotal
}: DadosClienteProps) {
  const { settings } = useSettings();

  const hasFreeShipping = settings.freeShippingThreshold !== undefined && settings.freeShippingThreshold > 0 && cartTotal >= settings.freeShippingThreshold;
  
  let pacPrice = 15.90;
  let sedexPrice = 32.50;

  if (hasFreeShipping) {
    pacPrice = 0;
  } else if (settings.fixedShippingRates && formData.estado && settings.fixedShippingRates[formData.estado]) {
    pacPrice = settings.fixedShippingRates[formData.estado];
    sedexPrice = pacPrice + 16.60;
  }

  useEffect(() => {
    // If not selected or currently selected shipping is not available, default to PAC
    if (selectedShipping !== pacPrice && selectedShipping !== sedexPrice) {
      setSelectedShipping(pacPrice);
    }
  }, [pacPrice, sedexPrice, selectedShipping, setSelectedShipping]);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded shadow-sm p-5">
        <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          Novo cadastro
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">E-mail *</label>
            <input 
              required 
              type="email" 
              value={formData.email} 
              onChange={e => {
                setFormData({...formData, email: e.target.value});
                if (errors.email) setErrors({...errors, email: false});
              }} 
              className={`w-full border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400`} 
            />
            {errors.email && <span className="text-xs text-red-500 mt-1">E-mail inválido (obrigatório)</span>}
          </div>

          <div className="flex gap-4 text-xs font-bold text-gray-700">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="tipo" defaultChecked className="accent-gray-600" />
              Pessoa Física
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="tipo" className="accent-gray-600" />
              Pessoa Jurídica
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nome completo</label>
            <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400" />
          </div>

          

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Sexo</label>
              <select required className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white">
                <option value="">- Selecione -</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Data de nascimento</label>
              <input 
                required 
                type="text" 
                placeholder="DD/MM/AAAA" 
                value={birthDate}
                maxLength={10}
                onChange={e => {
                  setBirthDate(maskDate(e.target.value));
                  if (errors.birthDate) setErrors({...errors, birthDate: false});
                }}
                className={`w-full border ${errors.birthDate ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400`} 
              />
              {errors.birthDate && <span className="text-xs text-red-500 mt-1">Data inválida</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Celular / WhatsApp *</label>
            <input 
              required 
              type="text" 
              value={formData.celular} 
              maxLength={15}
              onChange={e => {
                setFormData({...formData, celular: maskPhone(e.target.value)});
                if (errors.celular) setErrors({...errors, celular: false});
              }} 
              className={`w-full border ${errors.celular ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400`} 
            />
            {errors.celular && <span className="text-xs text-red-500 mt-1 block">Celular inválido (obrigatório)</span>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded shadow-sm p-5 h-fit">
        <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          Entrega
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">CEP</label>
            <div className="relative max-w-[150px]">
              <input 
                required 
                type="text" 
                value={formData.cep} 
                maxLength={9}
                onChange={handleCepChange} 
                className={`w-full border ${errors.cep ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400`} 
              />
              {cepLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {errors.cep && <span className="text-xs text-red-500 mt-1 block">CEP inválido</span>}
            <a href="#" className="text-[10px] text-blue-600 hover:underline mt-1 inline-block">Não sei meu CEP</a>
          </div>

          {formData.rua && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Endereço</label>
                <input required type="text" value={formData.rua} onChange={e => setFormData({...formData, rua: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400 bg-gray-50" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Número</label>
                  <input required type="text" value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Complemento</label>
                  <input type="text" value={formData.complemento} onChange={e => setFormData({...formData, complemento: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bairro</label>
                  <input required type="text" value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cidade/UF</label>
                  <input required type="text" value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                <label className="block text-xs font-bold text-gray-700 mb-2">Opções de Frete</label>
                <div className="space-y-2">
                  <label className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${selectedShipping === pacPrice ? 'border-[#5ba324] bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="shipping" checked={selectedShipping === pacPrice} onChange={() => setSelectedShipping(pacPrice)} className="accent-[#5ba324]" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800">PAC</span>
                        <span className="text-xs text-gray-500">Em até 7 dias úteis</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{pacPrice === 0 ? 'Grátis' : `R$ ${pacPrice.toFixed(2).replace('.', ',')}`}</span>
                  </label>
                  <label className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${selectedShipping === sedexPrice ? 'border-[#5ba324] bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="shipping" checked={selectedShipping === sedexPrice} onChange={() => setSelectedShipping(sedexPrice)} className="accent-[#5ba324]" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800">SEDEX</span>
                        <span className="text-xs text-gray-500">Em até 3 dias úteis</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{sedexPrice === 0 ? 'Grátis' : `R$ ${sedexPrice.toFixed(2).replace('.', ',')}`}</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
