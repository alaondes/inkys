import React, { useState, useEffect, useRef } from 'react';
import { formatPrice } from '../data/products';
import { CartItem } from '../storefront/Storefront';
import { ShieldCheck, Paperclip, FileText, RefreshCw, Info } from 'lucide-react';
import { CheckoutData } from '../utils/whatsapp';
import { useSettings } from '../context/SettingsContext';

interface CheckoutPageProps {
  cart: CartItem[];
  updateItemFile: (cartItemId: string, file: File | undefined) => void;
  onComplete: (data: CheckoutData) => void;
  onBack: () => void;
}

export function CheckoutPage({ cart, updateItemFile, onComplete, onBack }: CheckoutPageProps) {
  const { settings } = useSettings();
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    cpf: '',
    celular: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [agreed, setAgreed] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.substring(0, 8);
    
    setFormData(prev => ({ ...prev, cep: value }));

    if (value.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            rua: data.logradouro || prev.rua,
            bairro: data.bairro || prev.bairro,
            cidade: `${data.localidade}/${data.uf}` || prev.cidade,
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  useEffect(() => {
    if (settings.paymentMethods) {
      if (settings.paymentMethods.pix !== false) {
        setPaymentMethod('pix');
      } else if (settings.paymentMethods.credit) {
        setPaymentMethod('credit');
      } else if (settings.paymentMethods.boleto) {
        setPaymentMethod('boleto');
      }
    }
  }, [settings.paymentMethods]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const pixDiscount = 0.10;
  const total = paymentMethod === 'pix' ? subtotal * (1 - pixDiscount) : subtotal;

  if (cart.length === 0) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 py-16 text-center bg-white rounded shadow-sm border border-gray-200 mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Seu carrinho está vazio</h2>
        <p className="text-gray-500 mb-8">Adicione produtos para prosseguir com a compra.</p>
        <button 
          onClick={onBack} 
          className="px-6 py-2.5 text-white rounded font-bold hover:brightness-90 transition-colors"
          style={{ backgroundColor: settings.topBarColor }}
        >
          Continuar Comprando
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      alert('Você precisa concordar com os termos de Política de Privacidade.');
      return;
    }
    
    // Obter tipo
    const formElement = e.target as HTMLFormElement;
    const tipo = ((formElement.elements.namedItem('tipo') as RadioNodeList)[0] as HTMLInputElement).checked ? 'Pessoa Física' : 'Pessoa Jurídica';
    const genderSelect = formElement.querySelector('select');
    const gender = genderSelect && genderSelect.value !== '- Selecione -' ? genderSelect.value : '';
    const birthInput = formElement.querySelectorAll('input[type="text"]')[1] as HTMLInputElement;
    const birthDate = birthInput ? birthInput.value : '';
    const landlineInput = formElement.querySelectorAll('input[type="text"]')[3] as HTMLInputElement;
    const landline = landlineInput ? landlineInput.value : '';

    onComplete({
      email: formData.email,
      type: tipo,
      name: formData.nome,
      cpf: formData.cpf,
      gender: gender,
      birthDate: birthDate,
      phone: formData.celular,
      landline: landline,
      address: `${formData.rua ? formData.rua + ', ' : ''}${formData.numero ? formData.numero + ' - ' : ''}${formData.complemento ? formData.complemento + ' - ' : ''}${formData.bairro ? formData.bairro + ', ' : ''}${formData.cidade ? formData.cidade + ' - ' : ''}CEP: ${formData.cep}`,
      paymentMethod: paymentMethod
    });
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      {/* Order Summary */}
      <div className="bg-white border border-gray-200 rounded shadow-sm mb-6">
        <div className="grid grid-cols-12 border-b border-gray-100 p-4 text-sm font-bold text-gray-700 bg-gray-50">
          <div className="col-span-8">Produtos</div>
          <div className="col-span-2 text-center">Qtd.</div>
          <div className="col-span-2 text-right">Preço</div>
        </div>
        
        {cart.map((item) => (
          <div key={item.cartItemId} className="grid grid-cols-12 p-4 border-b border-gray-100 text-sm items-center">
            <div className="col-span-8 flex flex-col">
              <span className="text-gray-700">{item.name} {item.selectedColor ? `- ${item.selectedColor}` : ''}</span>
              <span className="text-xs text-gray-500 mt-0.5">Cód: {(item.id || '').substring(0, 4).toUpperCase()}</span>
              
              <div className="mt-2">
                {item.file ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#3b9370] font-bold flex items-center gap-1"><Paperclip size={12} /> 1 arquivo enviado</span>
                    <button type="button" onClick={() => fileInputRefs.current[item.cartItemId]?.click()} className="text-[11px] text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                      <RefreshCw size={10} /> Alterar
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRefs.current[item.cartItemId]?.click()} className="text-xs text-gray-500 hover:text-[#3b9370] flex items-center gap-1 transition-colors font-medium">
                    <Paperclip size={12} /> Anexar arquivo
                  </button>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  ref={el => fileInputRefs.current[item.cartItemId] = el}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      updateItemFile(item.cartItemId, e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>
            <div className="col-span-2 text-center text-gray-700">{item.quantity}</div>
            <div className="col-span-2 text-right font-bold text-[#5ba324]">{formatPrice(item.price * item.quantity)}</div>
          </div>
        ))}

        <div className="p-4 flex flex-col items-end gap-2 text-sm text-gray-700">
          <div className="flex justify-between w-48">
            <span>Subtotal:</span>
            <span className="font-bold">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between w-48">
            <span>Frete:</span>
            <span className="text-gray-400 text-xs">(defina abaixo)</span>
          </div>
          <div className="flex justify-between w-48 text-lg mt-2">
            <span>Total:</span>
            <span className="font-bold text-gray-900">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-8 text-sm text-blue-800 flex gap-3">
        <Info className="flex-shrink-0 text-blue-500 mt-0.5" size={18} />
        <div>
          <p className="font-bold mb-1">Como enviar sua arte:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Anexe os arquivos para cada produto na seção "Arquivo" acima.</li>
            <li>Certifique-se de que a imagem esteja em boa resolução.</li>
            <li>Se preferir, ou se tiver dificuldades, você também poderá enviar a arte diretamente pelo WhatsApp após finalizar o pedido.</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Box 1: Cadastro */}
        <div className="bg-white border border-gray-200 rounded shadow-sm p-5">
          <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Novo cadastro ou <a href="#" className="underline text-gray-800">Usar minha conta</a>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">E-mail</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400" />
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

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">CPF</label>
              <input type="text" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400 max-w-[150px]" />
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
                <input required type="text" placeholder="DD/MM/AAAA" className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Celular</label>
                <input required type="text" value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Telefone fixo</label>
                <input type="text" className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Entrega */}
        <div className="bg-white border border-gray-200 rounded shadow-sm p-5 h-fit">
          <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Entrega
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">CEP {isLoadingCep && <span className="text-gray-400 font-normal ml-2">Buscando...</span>}</label>
              <input required type="text" value={formData.cep} onChange={handleCepChange} maxLength={8} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400 max-w-[120px]" />
            </div>
            
            {formData.cep.length >= 8 && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rua/Avenida</label>
                  <input required type="text" value={formData.rua} onChange={e => setFormData({...formData, rua: e.target.value})} className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-gray-400" />
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
              </>
            )}
          </div>
        </div>

        {/* Box 3: Pagamento */}
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

          <button type="submit" className="w-full bg-[#8bc34a] hover:bg-[#7cb342] text-white font-bold py-3 px-4 rounded-sm transition-colors flex justify-center items-center gap-2 mb-6 shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Finalizar compra
          </button>

          <div className="flex items-center justify-center gap-2">
            <ShieldCheck size={28} className="text-[#5ba324]" strokeWidth={1.5} />
            <div className="leading-tight">
              <div className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Compra segura</div>
              <div className="text-[11px] font-bold text-gray-800 uppercase tracking-tighter">Site protegido</div>
              <div className="text-[7px] text-gray-400 uppercase tracking-wider">Certificado SSL</div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
