import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface OpcoesPagamentoProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  agreed: boolean;
  setAgreed: (agreed: boolean) => void;
  isSubmitting: boolean;
}

export function OpcoesPagamento({
  paymentMethod, setPaymentMethod,
  agreed, setAgreed, isSubmitting
}: OpcoesPagamentoProps) {
  const { settings } = useSettings();

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-5 h-fit flex flex-col">
      <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
        Pagamento
      </h2>

      <div className="space-y-0 border border-gray-200 rounded-sm mb-6">
        {settings.paymentMethods?.pix !== false && (
          <label className={`flex items-center gap-3 p-3 cursor-pointer border-b border-gray-200 ${paymentMethod === 'pix' ? 'bg-gray-50' : ''}`}>
            <input type="radio" name="payment" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className="accent-[#5ba324] w-4 h-4" />
            <div className="flex items-center gap-2">
              <span className="text-[#32bcad] font-bold">pix</span>
              <span className="text-xs text-gray-500">Desconto de 10%</span>
            </div>
          </label>
        )}
        
        {settings.paymentMethods?.boleto && (
          <label className={`flex items-center gap-3 p-3 cursor-pointer border-b border-gray-200 ${paymentMethod === 'boleto' ? 'bg-gray-50' : ''}`}>
            <input type="radio" name="payment" checked={paymentMethod === 'boleto'} onChange={() => setPaymentMethod('boleto')} className="accent-[#5ba324] w-4 h-4" />
            <div className="flex flex-col">
              <span className="text-sm text-gray-800 font-bold leading-none">Boleto</span>
              <span className="text-sm text-gray-800 font-bold leading-none">Bancário</span>
            </div>
          </label>
        )}

        {settings.paymentMethods?.credit && (
          <label className={`flex items-center gap-3 p-3 cursor-pointer ${paymentMethod === 'credit' ? 'bg-gray-50' : ''}`}>
            <input type="radio" name="payment" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} className="accent-[#5ba324] w-4 h-4" />
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] font-bold border border-gray-300 rounded px-1 py-0.5 text-blue-800">VISA</span>
              <span className="text-[10px] font-bold border border-gray-300 rounded px-1 py-0.5 text-red-600">MasterCard</span>
              <span className="text-[10px] font-bold border border-gray-300 rounded px-1 py-0.5 text-orange-500">Hiper</span>
              <span className="text-[10px] font-bold border border-gray-300 rounded px-1 py-0.5 text-blue-600">Amex</span>
              <span className="text-[10px] font-bold border border-gray-300 rounded px-1 py-0.5 text-black">elo</span>
            </div>
          </label>
        )}
      </div>

      <label className="flex items-start gap-2 mb-6 cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 accent-[#5ba324]" />
        <span className="text-xs text-gray-600">Li e concordo com os termos da <a href="#" className="underline">Política de Privacidade</a></span>
      </label>

      <button disabled={isSubmitting} type="submit" className={`w-full text-white font-bold py-3 px-4 rounded-sm transition-colors flex justify-center items-center gap-2 mb-6 shadow-sm ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#8bc34a] hover:bg-[#7cb342]'}`}>
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processando e Enviando Arte...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Finalizar compra
          </>
        )}
      </button>

      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
        <div className="flex items-center justify-center gap-2 bg-green-50 p-2 rounded-md">
          <ShieldCheck size={24} className="text-green-600" />
          <div className="text-xs font-bold text-green-800">
            Compra 100% Segura <br/>
            <span className="font-normal text-green-700 text-[10px]">Ambiente protegido por certificado SSL</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-1"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            <span className="text-[10px] text-gray-500 font-bold">Entrega Garantida</span>
          </div>
          <div className="flex flex-col items-center">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span className="text-[10px] text-gray-500 font-bold">Privacidade Protegida</span>
          </div>
        </div>
      </div>
    </div>
  );
}
