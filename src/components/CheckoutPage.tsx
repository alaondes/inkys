import React, { useState, useEffect, useRef } from 'react';
import { CartItem } from '../storefront/Storefront';
import { CheckoutData } from '../utils/whatsapp';
import { maskCEP, validateEmail, validateCPF } from '../utils/validation';
import { ResumoCarrinho } from './checkout/ResumoCarrinho';
import { DadosCliente } from './checkout/DadosCliente';
import { OpcoesPagamento } from './checkout/OpcoesPagamento';
import toast from 'react-hot-toast';

interface CheckoutPageProps {
  cart: CartItem[];
  updateItemFile: (cartItemId: string, file: File | undefined) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  onComplete: (data: CheckoutData) => Promise<void>;
  onBack: () => void;
}

export function CheckoutPage({ 
  cart, 
  updateItemFile, 
  updateQuantity,
  removeFromCart,
  clearCart,
  onComplete, 
  onBack 
}: CheckoutPageProps) {
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
  
  const [birthDate, setBirthDate] = useState('');
  const [landline, setLandline] = useState('');
  
  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: boolean}>({});
  
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [selectedShipping, setSelectedShipping] = useState<number>(15.90);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const maskedValue = maskCEP(e.target.value);
    
    setFormData(prev => ({...prev, cep: maskedValue}));
    if (errors.cep) setErrors({...errors, cep: false});

    if (rawValue.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${rawValue}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
        } else {
          setErrors(prev => ({...prev, cep: true}));
        }
      } catch (err) {
        setErrors(prev => ({...prev, cep: true}));
      } finally {
        setCepLoading(false);
      }
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase()));
      const { withTimeout } = await import('../lib/firestoreUtils');
      const snap = await withTimeout(getDocs(q));
      
      if (snap.empty) {
        toast.error('Cupom inválido ou não encontrado.');
        return;
      }
      
      const c = snap.docs[0].data();
      if (!c.active) {
        toast.error('Este cupom está inativo.');
        return;
      }
      
      if (c.minPurchase && cartTotal < c.minPurchase) {
        toast.error(`Este cupom exige compra mínima de R$ ${c.minPurchase.toFixed(2).replace('.', ',')}`);
        return;
      }
      
      setAppliedCoupon({ id: snap.docs[0].id, ...c });
      toast.success('Cupom aplicado com sucesso!');
    } catch (e) {
      toast.error('Erro ao verificar cupom.');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Seu carrinho está vazio</h2>
        <button 
          onClick={onBack}
          className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-md font-bold hover:brightness-90 transition-all shadow-lg"
        >
          Continuar Comprando
        </button>
      </div>
    );
  }

  const cartTotalWithDiscount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' 
        ? cartTotal * (1 - appliedCoupon.value / 100) 
        : Math.max(0, cartTotal - appliedCoupon.value))
    : cartTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: {[key: string]: boolean} = {};
    if (!validateEmail(formData.email)) newErrors.email = true;
    
    if (formData.celular.replace(/\D/g, '').length < 10) newErrors.celular = true;
    if (formData.cep.replace(/\D/g, '').length !== 8) newErrors.cep = true;
    if (birthDate && birthDate.replace(/\D/g, '').length !== 8) newErrors.birthDate = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Por favor, corrija os campos destacados em vermelho (e-mail, etc).');
      return;
    }
    
    if (!agreed) {
      toast.error('Você precisa concordar com os termos de Política de Privacidade.');
      return;
    }
    
    setIsSubmitting(true);
    
    const formElement = e.target as HTMLFormElement;
    const tipo = ((formElement.elements.namedItem('tipo') as RadioNodeList)[0] as HTMLInputElement).checked ? 'Pessoa Física' : 'Pessoa Jurídica';
    const genderSelect = formElement.querySelector('select');
    const gender = genderSelect && genderSelect.value !== '- Selecione -' ? genderSelect.value : '';

    try {
      await onComplete({
        email: formData.email,
        type: tipo,
        name: formData.nome,
        
        gender: gender,
        birthDate: birthDate,
        phone: formData.celular,
        landline: landline,
        address: `${formData.rua ? formData.rua + ', ' : ''}${formData.numero ? formData.numero + ' - ' : ''}${formData.complemento ? formData.complemento + ' - ' : ''}${formData.bairro ? formData.bairro + ', ' : ''}${formData.cidade ? formData.cidade + ' - ' : ''}CEP: ${formData.cep}`,
        street: formData.rua,
        number: formData.numero,
        complement: formData.complemento,
        neighborhood: formData.bairro,
        city: formData.cidade,
        state: formData.estado,
        zipCode: formData.cep,
        paymentMethod: paymentMethod,
        shippingCost: selectedShipping,
        coupon: appliedCoupon ? appliedCoupon.code : undefined,
        couponDiscount: cartTotal - cartTotalWithDiscount
      });
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      toast.error('Ocorreu um erro ao processar o seu pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-900 font-medium mb-6 flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Continuar comprando
      </button>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 items-start">
        <div className="flex flex-col gap-6">
          <ResumoCarrinho 
            cart={cart} 
            fileInputRefs={fileInputRefs} 
            updateItemFile={updateItemFile} 
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            onClearCart={clearCart}
          />

          <DadosCliente 
            formData={formData} 
            setFormData={setFormData}
            errors={errors} 
            setErrors={setErrors}
            birthDate={birthDate} 
            setBirthDate={setBirthDate}
            landline={landline} 
            setLandline={setLandline}
            handleCepChange={handleCepChange}
            cepLoading={cepLoading}
            selectedShipping={selectedShipping}
            setSelectedShipping={setSelectedShipping}
            cartTotal={cartTotalWithDiscount}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded shadow-sm p-5 h-fit flex flex-col">
            <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
              Cupom de Desconto
            </h2>
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Código do cupom" 
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-sm focus:border-[#5ba324] outline-none uppercase"
                />
                <button 
                  type="button" 
                  onClick={handleApplyCoupon}
                  className="bg-gray-800 text-white px-4 rounded font-bold text-sm hover:bg-gray-700"
                >
                  Aplicar
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded p-3 flex justify-between items-center">
                <div>
                  <span className="text-green-800 font-bold text-sm">{appliedCoupon.code}</span>
                  <div className="text-green-600 text-xs mt-0.5">
                    {appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}% de desconto` : `R$ ${appliedCoupon.value.toFixed(2).replace('.', ',')} de desconto`}
                  </div>
                </div>
                <button type="button" onClick={removeCoupon} className="text-red-500 text-xs hover:underline">Remover</button>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Subtotal</span>
                <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-600 font-medium mb-1">
                  <span>Desconto ({appliedCoupon.code})</span>
                  <span>- R$ {(cartTotal - cartTotalWithDiscount).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 text-lg mt-2">
                <span>Total Produtos</span>
                <span>R$ {cartTotalWithDiscount.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          <OpcoesPagamento 
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            agreed={agreed}
            setAgreed={setAgreed}
            isSubmitting={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
}
