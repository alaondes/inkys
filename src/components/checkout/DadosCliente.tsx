import React from 'react';
import { maskDate, maskPhone, maskCEP, maskCPF } from '../../utils/validation';

interface DadosClienteProps {
  formData: any;
  setFormData: any;
  errors: any;
  setErrors: any;
  birthDate: string;
  setBirthDate: any;
  handleCepChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cepLoading: boolean;
  selectedShipping: any;
  setSelectedShipping: any;
  shippingOptions: any[];
  calculatingShipping: boolean;
}

export function DadosCliente({
  formData, setFormData, errors, setErrors, 
  birthDate, setBirthDate, handleCepChange, cepLoading,
  selectedShipping, setSelectedShipping, shippingOptions, calculatingShipping
}: DadosClienteProps) {
  
  return (
    <>
      <div className="bg-white border border-gray-200 rounded shadow-sm p-5">
        <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          Dados do Comprador
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
              placeholder="Para onde enviaremos o seu pedido"
            />
            {errors.email && <span className="text-xs text-red-500 mt-1">E-mail inválido (obrigatório)</span>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nome completo</label>
            <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              {errors.celular && <span className="text-xs text-red-500 mt-1 block">Celular inválido</span>}
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
            <label className="block text-xs font-bold text-gray-700 mb-1">CPF *</label>
            <input 
              required 
              type="text" 
              value={formData.cpf} 
              maxLength={14}
              onChange={e => {
                setFormData({...formData, cpf: maskCPF(e.target.value)});
                if (errors.cpf) setErrors({...errors, cpf: false});
              }} 
              className={`w-full border ${errors.cpf ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400`} 
            />
            {errors.cpf && <span className="text-xs text-red-500 mt-1 block">CPF inválido (obrigatório)</span>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded shadow-sm p-5 mt-4">
        <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          Entrega
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">CEP *</label>
              <div className="relative">
                <input 
                  required 
                  type="text" 
                  value={formData.cep} 
                  maxLength={9}
                  onChange={handleCepChange} 
                  className={`w-full border ${errors.cep ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400`} 
                />
                {cepLoading && (
                  <div className="absolute right-3 top-2.5">
                    <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  </div>
                )}
              </div>
              {errors.cep && <span className="text-xs text-red-500 mt-1 block">CEP inválido (obrigatório)</span>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Endereço</label>
            <input required type="text" value={formData.rua} onChange={e => setFormData({...formData, rua: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400 bg-gray-50" readOnly={!!formData.rua} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">Número *</label>
              <input 
                required 
                type="text" 
                value={formData.numero} 
                onChange={e => {
                  setFormData({...formData, numero: e.target.value});
                  if (errors.numero) setErrors({...errors, numero: false});
                }} 
                className={`w-full border ${errors.numero ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400`} 
              />
              {errors.numero && <span className="text-xs text-red-500 mt-1 block">Obrigatório</span>}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Complemento</label>
              <input type="text" value={formData.complemento} onChange={e => setFormData({...formData, complemento: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Bairro</label>
              <input required type="text" value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400 bg-gray-50" readOnly={!!formData.bairro} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Cidade</label>
                <input required type="text" value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400 bg-gray-50" readOnly={!!formData.cidade} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Estado</label>
                <input required type="text" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400 bg-gray-50" readOnly={!!formData.estado} />
              </div>
            </div>
          </div>

          {/* Opções de Frete */}
          {formData.cep.length === 9 && !cepLoading && shippingOptions.length > 0 && (
            <div className="mt-6">
              <label className="block text-xs font-bold text-gray-700 mb-2">Forma de entrega</label>
              <div className="space-y-2">
                {shippingOptions.map((option) => (
                  <label 
                    key={option.id} 
                    onClick={() => setSelectedShipping(option)}
                    className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${selectedShipping?.id === option.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedShipping?.id === option.id ? 'border-[var(--color-primary)]' : 'border-gray-300'}`}>
                        {selectedShipping?.id === option.id && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{option.name}</div>
                        <div className="text-xs text-gray-500">{option.days} {option.days === 1 ? 'dia útil' : 'dias úteis'}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-gray-800">
                      {option.price === 0 ? <span className="text-green-600">Grátis</span> : `R$ ${option.price.toFixed(2).replace('.', ',')}`}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          {calculatingShipping && (
            <div className="mt-4 p-4 text-center text-sm text-gray-500 bg-gray-50 rounded flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Calculando frete...
            </div>
          )}
        </div>
      </div>
    </>
  );
}
