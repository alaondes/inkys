import React, { useState } from 'react';
import { Product, formatPrice } from '../data/products';
import { Star, ChevronLeft, Share2, Heart, Video } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
}

export function ProductDetails({ product, onBack, onAddToCart }: ProductDetailsProps) {
  const { settings } = useSettings();
  const rawImages = [product.image, ...(product.gallery || [])].filter(Boolean);
  const images = rawImages.length > 0 ? rawImages : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop'];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const rating = 5;
  const reviews = 5;
  const pixDiscount = 0.10;
  const pixPrice = product.price * (1 - pixDiscount);
  const installments = 2;
  const installmentPrice = product.price / installments;

  const handleWhatsapp = () => {
    const message = encodeURIComponent(`Olá! Gostaria de tirar uma dúvida sobre o produto ${product.name}.`);
    const number = settings.whatsappNumber;
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <button onClick={onBack} className="hover:text-gray-900 transition-colors">Início</button>
          <span>›</span>
          <span className="hover:text-gray-900 transition-colors cursor-pointer">Coleção</span>
          <span>›</span>
          <span className="text-gray-900">{product.category}</span>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Gallery */}
          <div className="w-full md:w-[60%] flex gap-4">
            {/* Thumbnails */}
            <div className="w-20 flex flex-col gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`w-20 h-20 border rounded-lg overflow-hidden ${i === currentImageIndex ? 'border-gray-400' : 'border-gray-200'}`}
                >
                  <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            
            {/* Main Image */}
            <div className="flex-1 relative border border-gray-100 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
               <button className="absolute top-4 right-4 bg-white border border-gray-200 px-3 py-1 rounded text-sm text-gray-600 flex items-center gap-2 z-10 shadow-sm">
                 <Video size={16} className="text-red-600" /> Vídeo
               </button>
               <img src={images[currentImageIndex]} alt={product.name} className="w-full h-auto max-h-[600px] object-contain mix-blend-multiply" />
            </div>
          </div>
          
          {/* Info */}
          <div className="w-full md:w-[40%]">
            <div className="text-gray-500 text-sm mb-1">Amo Canecas</div>
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
              <div className="text-4xl font-bold text-[#5ba324] leading-none mb-1">
                {formatPrice(pixPrice)} <span className="text-sm font-normal">no pix</span>
              </div>
              <div className="text-sm text-gray-500 mb-2">com 10% de desconto</div>
              <div className="text-base font-bold text-gray-800 line-through decoration-gray-400">
                {formatPrice(product.price + 5)}
              </div>
              <div className="text-base font-bold text-gray-800">
                {formatPrice(product.price)}
              </div>
              <div className="text-sm text-gray-600">
                até <span className="font-bold">{installments}x</span> de <span className="font-bold">{formatPrice(installmentPrice)}</span> sem juros
              </div>
            </div>
            
            {/* Payment methods */}
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
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
               
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 bg-teal-400 rounded-sm"></div> <span className="text-gray-500">PIX</span>
                   </div>
                   <span className="font-bold">{formatPrice(pixPrice)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-3 bg-gray-800"></div> <span className="text-gray-500">Boleto</span>
                   </div>
                   <span className="font-bold">{formatPrice(product.price)}</span>
                 </div>
               </div>
            </div>

            <div className="flex flex-col gap-3 w-full mb-6">
              <button 
                onClick={() => onAddToCart(product)}
                className="w-full bg-[#5ba324] text-white py-4 rounded font-bold text-xl hover:bg-[#4d8b1f] transition-colors"
              >
                Comprar
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
               <button className="flex items-center gap-2 hover:text-gray-800"><Share2 size={16}/> Compartilhar</button>
               <button className="flex items-center gap-2 hover:text-gray-800"><Heart size={16}/> Adicionar aos desejos</button>
            </div>

            {/* Calculate shipping */}
            <div>
               <label className="block text-sm text-gray-700 mb-2">Calcule o frete</label>
               <div className="flex gap-2">
                 <input type="text" placeholder="CEP" className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                 <button className="border border-gray-300 rounded px-6 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Calcular</button>
               </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Description */}
      <div className="bg-[#fcfafc] py-16 border-t border-b border-gray-100 mt-12">
         <div className="max-w-[800px] mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-[#783884] mb-8">Descrição</h2>
            <div className="text-left space-y-4 text-[15px] text-gray-700 italic">
               <p>Dê um toque de elegância e exclusividade ao seu presente com a <strong>caneca 100% preta personalizada com foto e música do Spotify.</strong></p>
               <p>Com um visual sofisticado e moderno, ela permite estampar a imagem de sua escolha junto ao código da sua música favorita, criando um item único que une estilo e emoção.</p>
               <p>Produzida em <strong>cerâmica de alta qualidade</strong>, essa caneca oferece resistência, durabilidade e um acabamento impecável que realça a estampa sobre o fundo preto intenso.</p>
               <p>Com <strong>capacidade de 325ml</strong>, é perfeita para apreciar café, chá ou qualquer bebida preferida com muito mais personalidade.</p>
               <p>Acompanha uma <strong>linda caixinha estampada para presente</strong>, pronta para encantar já no momento da entrega.</p>
               <p>E para garantir ainda mais praticidade, é <strong>segura para uso no micro-ondas e na lava-louças</strong>, preservando cores e detalhes por muito mais tempo.</p>
               <p>A <strong>foto e o nome da música</strong> para personalização podem ser enviados pelo <strong>WhatsApp (19) 99847-0035</strong> ou pelo <strong>e-mail falecom@amocanecas.com.br</strong>, garantindo que sua caneca seja feita exatamente do jeito que você imaginou.</p>
               <p><strong>Sofisticação, personalização e música — tudo em uma única caneca que vai tocar o coração!</strong></p>
            </div>
         </div>
      </div>
      
      {/* Reviews */}
      <div className="py-16 bg-white">
         <div className="max-w-[800px] mx-auto px-4 text-center">
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
