import React, { useState } from 'react';
import { Product, formatPrice } from '../data/products';
import { ShoppingCart, ChevronLeft, ChevronRight, Star, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../context/SettingsContext';
import { toast } from 'react-hot-toast';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onAddToCart: (product: Product, selectedColor?: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product.colors?.[0]?.name
  );
  
  const { settings } = useSettings();
  
  const rawImages = [product.image, ...(product.gallery || [])].filter(Boolean);
  const images = rawImages.length > 0 ? rawImages : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop'];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/?view=product&id=${product.id}`;
    const shareText = `Olha o que eu achei na loja Inkys: ${product.name}!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Inkys - Personalizados',
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
           navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
           toast.success('Link copiado para a área de transferência!');
        }
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  return (
    <div className="flex flex-col items-center group bg-white border border-gray-100 rounded-xl p-2.5 sm:p-4 hover:shadow-xl transition-all duration-300 h-full w-full overflow-hidden">
      <div 
        className="aspect-square bg-white mb-2 sm:mb-4 relative w-full overflow-hidden cursor-pointer group/image rounded-lg shrink-0"
        onClick={() => onAddToCart(product, selectedColor)}
      >
        <AnimatePresence mode="wait">
          {images[currentImageIndex] && (
            <motion.img 
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={images[currentImageIndex] || undefined} 
              alt={product.name} 
              className="absolute inset-0 w-full h-full object-cover mix-blend-multiply"
            />
          )}
        </AnimatePresence>
        
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <div className="absolute left-2 top-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md z-20 uppercase tracking-wider flex items-center gap-1">
            <span>🔥</span>
            <span>{Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF</span>
          </div>
        )}
        
        <button 
          onClick={handleShare}
          title="Compartilhar Produto"
          className="absolute right-2 top-2 bg-white/90 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-md opacity-0 group-hover/image:opacity-100 transition-all z-20"
        >
          <Share2 size={14} />
        </button>
        
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-1 rounded-full shadow-md opacity-0 group-hover/image:opacity-100 transition-all z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-1 rounded-full shadow-md opacity-0 group-hover/image:opacity-100 transition-all z-10"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
      
      <div className="flex flex-col flex-grow w-full pt-2">
        <h3 
          className="text-[13px] sm:text-[14px] font-medium text-gray-800 leading-snug mb-2 cursor-pointer hover:text-gray-500 line-clamp-2 break-words text-center min-h-[40px] flex items-center justify-center"
          onClick={() => onAddToCart(product, selectedColor)}
        >
          {product.name}
        </h3>

        {product.observation && (
          <div className="w-full mb-3 bg-gray-50 border border-gray-100 rounded-md py-1.5 px-2 text-[10px] sm:text-xs text-gray-600 text-center shadow-sm">
            {product.observation}
          </div>
        )}
        
        {/* Spacer to ensure bottom alignment */}
        <div className="flex-grow"></div>
        
        <div className="flex flex-col items-center mt-auto w-full">
          <div className="flex items-center gap-0.5 sm:gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={10} className={i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} />
            ))}
            <span className="text-[10px] text-gray-400 font-medium ml-1">({reviews})</span>
          </div>
          
          <div className="mb-3 w-full text-center flex flex-col items-center">
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-[11px] sm:text-xs font-medium text-gray-400 line-through decoration-gray-300">
                  De {formatPrice(product.compareAtPrice)}
                </span>
                <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  {Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF
                </span>
              </div>
            )}
            
            <div className="text-xl sm:text-2xl font-bold tracking-tight leading-none mb-1" style={{ color: settings.buyButtonColor }}>
              {formatPrice(pixPrice)} <span className="text-[10px] sm:text-xs font-normal text-gray-500 ml-0.5">no pix</span>
            </div>
            
            <div className="text-[10px] text-gray-500 font-medium mb-1.5">
              (com {Math.round(pixDiscount * 100)}% de desconto)
            </div>
            
            {settings.paymentMethods?.credit && (
              <div className="text-[10px] sm:text-[11px] text-gray-500">
                ou <span className="font-semibold text-gray-600">{installments}x</span> de <span className="font-semibold text-gray-600">{formatPrice(installmentPrice)}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            <button 
              onClick={() => product.stock !== undefined && product.stock <= 0 ? null : onAddToCart(product, selectedColor)}
              disabled={product.stock !== undefined && product.stock <= 0}
              className={`w-full text-white py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-[13px] transition-all shadow-sm ${product.stock !== undefined && product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:shadow'}`}
              style={{ backgroundColor: product.stock !== undefined && product.stock <= 0 ? '#9CA3AF' : settings.buyButtonColor }}
            >
              {product.stock !== undefined && product.stock <= 0 ? 'Esgotado' : 'Comprar agora'}
            </button>
            <button 
              onClick={handleWhatsapp}
              className="w-full bg-white border border-[#25D366] text-[#25D366] py-2 rounded-lg text-[10px] sm:text-[11px] font-medium hover:bg-[#25D366]/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
              <span>Dúvidas pelo WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
