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
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      <button 
        onClick={scrollLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 bg-white shadow-md text-gray-700 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
      >
        <ChevronLeft size={24} />
      </button>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide hide-scroll-bar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map(product => (
          <div key={product.id} className="min-w-[280px] w-[280px] shrink-0 snap-start">
            <ProductCard product={product} onAddToCart={() => onAddToCart(product)} />
          </div>
        ))}
      </div>

      <button 
        onClick={scrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 bg-white shadow-md text-gray-700 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
      >
        <ChevronRight size={24} />
      </button>
      
      <style>{`
        .hide-scroll-bar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
