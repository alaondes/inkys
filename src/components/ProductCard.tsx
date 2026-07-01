import React, { useState } from 'react';
import { Product, formatPrice } from '../data/products';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onAddToCart: (product: Product, selectedColor?: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product.colors?.[0]?.name
  );
  
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-5 card-hover relative group flex flex-col"
    >
      <div className="aspect-square bg-white rounded-xl mb-4 flex items-center justify-center border border-gray-100 overflow-hidden relative">
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
              className="object-contain w-full h-full opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-transform duration-500"
            />
          )}
        </AnimatePresence>
        
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm text-gray-800 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm text-gray-800 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentImageIndex ? 'bg-cyan-500' : 'bg-white/50 border border-gray-300'}`}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/80 backdrop-blur-md rounded text-cyan-700 border border-cyan-200">
            {product.category}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">{product.name}</h3>
        
        {product.colors && product.colors.length > 0 && (
          <div className="flex gap-2 mt-3 mb-1">
            {product.colors.map((color, index) => (
              <button
                key={`${color.name}-${index}`}
                onClick={() => setSelectedColor(color.name)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${selectedColor === color.name ? 'border-cyan-500 scale-110' : 'border-gray-200 hover:scale-110'}`}
                style={{ background: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        )}

        <p className="text-gray-500 text-xs mb-3 mt-2 line-clamp-2 flex-grow">{product.description}</p>
        
        <div className="flex justify-between items-end mt-auto">
          <span className="text-xl font-bold text-cyan-600">{formatPrice(product.price)}</span>
          <button 
            onClick={() => onAddToCart(product, selectedColor)}
            className="p-2 bg-gray-900 text-white rounded-lg font-bold text-xs uppercase hover:bg-pink-600 transition-all flex items-center gap-1"
            title="Adicionar ao carrinho"
          >
            Adicionar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
