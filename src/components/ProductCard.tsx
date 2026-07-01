import React, { useState } from 'react';
import { Product, formatPrice } from '../data/products';
import { ShoppingCart, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../context/SettingsContext';

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

  return (
    <div className="flex flex-col items-center group bg-white border border-gray-100 rounded-xl p-4 hover:shadow-xl transition-all duration-300 h-full w-full overflow-hidden">
      <div 
        className="aspect-square bg-white mb-4 relative w-full overflow-hidden cursor-pointer group/image rounded-lg shrink-0"
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
              src={images[currentImageIndex]} 
              alt={product.name} 
              className="absolute inset-0 w-full h-full object-contain p-4 mix-blend-multiply"
            />
          )}
        </AnimatePresence>
        
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-md opacity-0 group-hover/image:opacity-100 transition-all z-10"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-md opacity-0 group-hover/image:opacity-100 transition-all z-10"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      
      <div className="flex flex-col flex-grow items-center text-center px-2 w-full min-w-0">
        <h3 
          className="text-[15px] font-normal text-gray-700 leading-tight mb-2 min-h-[45px] cursor-pointer hover:text-[#783884] line-clamp-2 break-words w-full"
          onClick={() => onAddToCart(product, selectedColor)}
        >
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1 mb-2 shrink-0">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} className={i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} />
          ))}
          <span className="text-xs text-yellow-500 font-medium ml-1">({reviews})</span>
        </div>
        
        <div className="mb-4 w-full shrink-0">
          <div className="text-3xl font-bold leading-none mb-1" style={{ color: settings.buyButtonColor }}>
            {formatPrice(pixPrice)} <span className="text-sm font-normal">no pix</span>
          </div>
          <div className="text-[11px] text-gray-500 mb-2">com {Math.round(pixDiscount * 100)}% de desconto</div>
          
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <div className="text-sm font-bold text-gray-800 line-through decoration-gray-400">
              {formatPrice(product.compareAtPrice)}
            </div>
          )}
          
          <div className="text-sm font-bold text-gray-800">
            {formatPrice(product.price)}
          </div>
          {settings.paymentMethods?.credit && (
            <div className="text-[13px] text-gray-600">
              até <span className="font-bold">{installments}x</span> de <span className="font-bold">{formatPrice(installmentPrice)}</span> sem juros
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2 w-full mt-auto">
          <button 
            onClick={() => onAddToCart(product, selectedColor)}
            className="w-full text-white py-2.5 rounded font-bold text-[15px] hover:brightness-110 transition-all"
            style={{ backgroundColor: settings.buyButtonColor }}
          >
            Comprar
          </button>
          <button 
            onClick={handleWhatsapp}
            className="w-full border border-[#5ba324] text-[#5ba324] py-2.5 rounded text-[13px] hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
          >
            Dúvidas pelo whatsapp
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#5ba324]"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
