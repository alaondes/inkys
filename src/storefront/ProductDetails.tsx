import React, { useState, useEffect } from 'react';
import { Product, formatPrice } from '../data/products';
import { Star, ChevronLeft, ChevronRight, Share2, Heart, Video } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
}


const formatDescription = (desc: string) => {
  if (!desc) return '';
  // Se já tiver HTML, renderiza direto
  if (desc.includes('<p>') || desc.includes('<br>')) return desc;
  
  // Formatação inteligente para textos longos (quebra de linha em marcadores)
  return desc
    .replace(/ ✨ /g, '<br/><br/><span class="inline-block">✨</span> ')
    .replace(/ • /g, '<br/><span class="inline-block mt-1">•</span> ')
    .replace(/(Especificações|Cuidados|Muito mais do que uma caneca|Por que escolher)/g, '<br/><br/><strong class="text-gray-900 text-xl block mb-2">$1</strong>');
};

const ProductBannerCarousel = ({ banners }: { banners: any[] }) => {

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <div className="w-full mt-8 mb-4 max-w-[1200px] mx-auto px-4">
      <div className="relative w-full h-[150px] md:h-[250px] rounded-2xl overflow-hidden group shadow-sm">
        {banners.map((item, idx) => {
          const imgSrc = typeof item === 'string' ? item : item?.image;
          const link = typeof item === 'string' ? '' : item?.link;
          
          const imgEl = (
            <img
              src={imgSrc}
              alt={`Banner ${idx + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            />
          );
          
          return (
            <div key={idx}>
              {link ? (
                <a 
                  href={link} 
                  target={link.startsWith('http') ? "_blank" : "_self"} 
                  rel="noopener noreferrer"
                  className={`absolute inset-0 ${idx === currentIndex ? 'z-20' : '-z-10'}`}
                >
                  {imgEl}
                </a>
              ) : imgEl}
            </div>
          );
        })}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export function ProductDetails({ product, onBack, onAddToCart }: ProductDetailsProps) {
  const { settings } = useSettings();
  const rawImages = [product.image, ...(product.gallery || [])].filter(Boolean);
  const images = rawImages.length > 0 ? rawImages : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop'];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const rating = product.rating !== undefined ? product.rating : (settings.productRating || 5);
  const reviews = product.reviews !== undefined ? product.reviews : (settings.productReviews || 5);
  const pixDiscount = product.pixDiscount !== undefined ? product.pixDiscount : (settings.pixDiscount !== undefined ? settings.pixDiscount : 0.10);
  const pixPrice = product.price * (1 - pixDiscount);
  const installments = product.installments !== undefined ? product.installments : (settings.installments || 2);
  const installmentPrice = product.price / installments;

  const handleWhatsapp = () => {
    const message = encodeURIComponent(`Olá! Gostaria de tirar uma dúvida sobre o produto ${product.name}.`);
    const number = settings.whatsappNumber;
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
  };

  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Confira ${product.name} na ${settings.storeName}!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copiado para a área de transferência!');
      }
    } catch (error) {
      console.log('Error sharing', error);
    }
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const [cep, setCep] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<{name: string, price: number, days: number}[] | null>(null);

  const calculateShipping = () => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      alert("Por favor, insira um CEP válido com 8 dígitos.");
      return;
    }
    
    setShippingLoading(true);
    // Simulate API call
    setTimeout(() => {
      setShippingOptions([
        { name: 'PAC', price: 15.90, days: 7 },
        { name: 'SEDEX', price: 28.50, days: 3 }
      ]);
      setShippingLoading(false);
    }, 1000);
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <button onClick={onBack} className="hover:text-gray-900 transition-colors">Início</button>
          <span>›</span>
          <span className="text-gray-900">{product.category}</span>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Gallery */}
          <div className="w-full md:w-[60%] flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails list on the left (vertical on desktop, horizontal below on mobile) */}
            {images.length > 1 && (
              <div className="flex flex-row md:flex-col gap-3 overflow-auto max-h-[85px] md:max-h-[600px] w-full md:w-20 shrink-0 justify-start pb-2 md:pb-0 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 overflow-hidden bg-white flex items-center justify-center p-1 transition-all shrink-0 ${
                      idx === currentImageIndex 
                        ? 'border-gray-900 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`Thumbnail ${idx + 1}`} 
                      className="w-full h-full object-contain mix-blend-multiply" 
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 relative border border-gray-100 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  {images.length > 1 && (
                   <>
                     <button 
                       onClick={prevImage}
                       className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-sm transition-colors z-10"
                     >
                       <ChevronLeft size={24} />
                     </button>
                     <button 
                       onClick={nextImage}
                       className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-sm transition-colors z-10"
                     >
                       <ChevronRight size={24} />
                     </button>
                   </>
                 )}

                 <img src={images[currentImageIndex] || undefined} alt={product.name} className="w-full h-auto max-h-[600px] object-contain mix-blend-multiply p-8 md:p-12" />
            </div>
          </div>
          
          {/* Info */}
          <div className="w-full md:w-[40%]">
            <div className="text-gray-500 text-sm mb-1">{settings.storeName || 'inkys'}</div>
            <h1 className="text-2xl font-normal text-gray-800 mb-2">{product.name}</h1>
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
               <span className="text-xs text-gray-500">Cód: {(product.id || '').padStart(4, '0')}-xyz</span>
               <div className="flex items-center gap-1">
                 {[...Array(5)].map((_, i) => (
                   <Star key={i} size={14} className={i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} />
                 ))}
                 <span className="text-xs text-yellow-500 font-medium ml-1">({reviews})</span>
               </div>
            </div>

            <div className="mb-6">
              <div className="text-4xl font-bold leading-none mb-1" style={{ color: settings.buyButtonColor }}>
                {formatPrice(pixPrice)} <span className="text-sm font-normal">no pix</span>
              </div>
              <div className="text-sm text-gray-500 mb-2">com {Math.round(pixDiscount * 100)}% de desconto</div>
              
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <div className="text-base font-bold text-gray-800 line-through decoration-gray-400">
                  {formatPrice(product.compareAtPrice)}
                </div>
              )}
              
              <div className="text-base font-bold text-gray-800">
                {formatPrice(product.price)}
              </div>
              {settings.paymentMethods?.credit && (
                <div className="text-sm text-gray-600">
                  até <span className="font-bold">{installments}x</span> de <span className="font-bold">{formatPrice(installmentPrice)}</span> sem juros
                </div>
              )}
            </div>
            
            {/* Payment methods */}
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
               {settings.paymentMethods?.credit && (
                 <>
                   <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                     <div className="flex gap-1">
                        {/* Mock payment icons */}
                        <div className="w-8 h-5 bg-blue-600 rounded text-white text-[8px] flex items-center justify-center font-bold">VISA</div>
                        <div className="w-8 h-5 bg-orange-500 rounded text-white text-[8px] flex items-center justify-center font-bold">MASTER</div>
                     </div>
                     <button className="text-sm text-gray-600 flex items-center gap-1">Parcelas <span>v</span></button>
                   </div>
                   
                   <div className="space-y-2 text-sm text-gray-600 border-b border-gray-100 pb-4 mb-4">
                      <div className="flex justify-between">
                         <span><strong>1x</strong> de {formatPrice(product.price)} sem juros</span>
                      </div>
                      <div className="flex justify-between">
                         <span><strong>2x</strong> de {formatPrice(installmentPrice)} sem juros</span>
                      </div>
                   </div>
                 </>
               )}
               
               <div className="space-y-3">
                 {settings.paymentMethods?.pix !== false && (
                   <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center gap-2">
                       <div className="w-4 h-4 bg-teal-400 rounded-sm"></div> <span className="text-gray-500">PIX</span>
                     </div>
                     <span className="font-bold">{formatPrice(pixPrice)}</span>
                   </div>
                 )}
                 {settings.paymentMethods?.boleto && (
                   <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center gap-2">
                       <div className="w-4 h-3 bg-gray-800"></div> <span className="text-gray-500">Boleto</span>
                     </div>
                     <span className="font-bold">{formatPrice(product.price)}</span>
                   </div>
                 )}
               </div>
            </div>

            <div className="flex flex-col gap-3 w-full mb-6">
              <button 
                onClick={() => product.stock !== undefined && product.stock <= 0 ? null : onAddToCart(product)}
                disabled={product.stock !== undefined && product.stock <= 0}
                className={`w-full text-white py-4 rounded font-bold text-xl transition-all ${product.stock !== undefined && product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}`}
                style={{ backgroundColor: product.stock !== undefined && product.stock <= 0 ? '#9CA3AF' : settings.buyButtonColor }}
              >
                {product.stock !== undefined && product.stock <= 0 ? 'Esgotado' : 'Comprar'}
              </button>
              <button 
                onClick={handleWhatsapp}
                className="w-full border border-[#5ba324] text-[#5ba324] py-3 rounded text-sm hover:bg-green-50 transition-colors flex items-center justify-center gap-2 font-bold"
              >
                Dúvidas pelo whatsapp
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#5ba324]"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
              </button>
            </div>
            
            <div className="flex gap-6 justify-center text-sm text-gray-500 border-b border-gray-100 pb-6 mb-6">
               <button onClick={handleShare} className="flex items-center gap-2 hover:text-gray-800 transition-colors">
                 <Share2 size={16}/> Compartilhar
               </button>
               <button onClick={handleWishlist} className={`flex items-center gap-2 transition-colors ${isWishlisted ? 'text-red-500 hover:text-red-600' : 'hover:text-gray-800'}`}>
                 <Heart size={16} className={isWishlisted ? 'fill-current' : ''} /> {isWishlisted ? 'Na lista de desejos' : 'Adicionar aos desejos'}
               </button>
            </div>

            {/* Calculate shipping */}
            <div>
               <label className="block text-sm text-gray-700 mb-2">Calcule o frete</label>
               <div className="flex gap-2 mb-4">
                 <input 
                   type="text" 
                   value={cep}
                   onChange={e => {
                     let value = e.target.value.replace(/\D/g, '');
                     if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
                     setCep(value);
                   }}
                   maxLength={9}
                   placeholder="CEP" 
                   className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400" 
                 />
                 <button 
                   onClick={calculateShipping}
                   disabled={shippingLoading}
                   className="border border-gray-300 rounded px-6 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                 >
                   {shippingLoading ? 'Calculando...' : 'Calcular'}
                 </button>
               </div>
               
               {shippingOptions && (
                 <div className="border border-gray-200 rounded-lg overflow-hidden">
                   {shippingOptions.map((option, idx) => (
                     <div key={idx} className={`flex justify-between items-center p-3 text-sm ${idx !== shippingOptions.length -1 ? 'border-b border-gray-100' : ''}`}>
                       <div>
                         <span className="font-bold block text-gray-800">{option.name}</span>
                         <span className="text-gray-500 text-xs">Até {option.days} dias úteis</span>
                       </div>
                       <span className="font-bold text-gray-900">{formatPrice(option.price)}</span>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Banner Carousel */}
      {settings?.productBanners && settings.productBanners.length > 0 && <ProductBannerCarousel banners={settings.productBanners} />}
      
      {/* Description */}
      {product.description && (
        <div className="py-16 bg-white border-t border-gray-100 mt-12 relative overflow-hidden">
           {/* Decorative background elements */}
           <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
             <div className="absolute top-1/2 -left-24 w-72 h-72 bg-pink-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
           </div>

           <div className="max-w-[1200px] mx-auto px-4 relative z-10">
              <div className="flex items-center justify-center gap-4 mb-10">
                <div className="w-16 h-[2px] bg-gradient-to-r from-transparent to-[#783884]/40"></div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#783884] tracking-tight text-center">Descrição do Produto</h2>
                <div className="w-16 h-[2px] bg-gradient-to-l from-transparent to-[#783884]/40"></div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-purple-100/50">
                <div 
                  className="text-left space-y-4 text-[16px] md:text-lg text-gray-700 leading-relaxed whitespace-pre-wrap font-medium"
                  dangerouslySetInnerHTML={{ __html: formatDescription(product.description) }}
                />
              </div>
           </div>
        </div>
      )}
      
      {/* Reviews */}
      <div className="py-16 bg-white">
         <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-[#783884] mb-8">Avaliações dos consumidores</h2>
            <div className="flex justify-center items-center gap-12">
               <div className="text-center">
                 <div className="text-6xl font-bold text-gray-900 leading-none">5<span className="text-3xl text-gray-500 font-normal">/5</span></div>
                 <div className="text-sm text-gray-400 mt-2 mb-2">Baseado em {reviews} avaliações</div>
                 <div className="flex justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={24} className="fill-yellow-400 text-yellow-400" />
                    ))}
                 </div>
               </div>
               
               <div className="flex-1 max-w-[300px]">
                 <div className="text-right text-sm font-bold mb-2">Nota geral</div>
                 {[...Array(5)].map((_, i) => {
                   const stars = 5 - i;
                   const count = stars === 5 ? reviews : 0;
                   return (
                     <div key={stars} className="flex items-center gap-2 mb-1 text-sm text-gray-500">
                       <span className="w-3">{stars}</span>
                       <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                         <div className="h-full bg-yellow-400" style={{ width: `${(count/reviews)*100}%` }}></div>
                       </div>
                       <span className="w-6 text-right">({count})</span>
                     </div>
                   );
                 })}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
