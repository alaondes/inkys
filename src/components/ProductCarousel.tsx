import React, { useRef } from 'react';
import { ProductCard } from './ProductCard';
import { Product } from '../data/products';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCarouselProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductCarousel({ products, onAddToCart }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -scrollRef.current.offsetWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: scrollRef.current.offsetWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group w-full px-2 md:px-0">
      <button 
        onClick={scrollLeft}
        className="absolute -left-2 md:-left-12 top-1/2 -translate-y-1/2 z-20 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 text-gray-600 hover:text-black rounded-full p-2 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:scale-110 flex items-center justify-center w-9 h-9 md:w-12 md:h-12"
        aria-label="Anterior"
      >
        <ChevronLeft size={20} className="md:w-6 md:h-6" />
      </button>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 snap-x snap-mandatory scrollbar-hide hide-scroll-bar px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map(product => (
          <div key={product.id} className="min-w-[calc(50%-8px)] w-[calc(50%-8px)] md:min-w-[calc(25%-18px)] md:w-[calc(25%-18px)] shrink-0 snap-start">
            <ProductCard product={product} onAddToCart={() => onAddToCart(product)} />
          </div>
        ))}
      </div>

      <button 
        onClick={scrollRight}
        className="absolute -right-2 md:-right-12 top-1/2 -translate-y-1/2 z-20 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 text-gray-600 hover:text-black rounded-full p-2 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:scale-110 flex items-center justify-center w-9 h-9 md:w-12 md:h-12"
        aria-label="Próximo"
      >
        <ChevronRight size={20} className="md:w-6 md:h-6" />
      </button>
      
      <style>{`
        .hide-scroll-bar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
