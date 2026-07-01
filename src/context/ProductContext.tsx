import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, INITIAL_PRODUCTS } from '../data/products';

interface ProductContextType {
  products: Product[];
  setProducts: (products: Product[]) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('inkys_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse products from local storage', e);
    }
    return INITIAL_PRODUCTS;
  });

  useEffect(() => {
    localStorage.setItem('inkys_products', JSON.stringify(products));
  }, [products]);

  return (
    <ProductContext.Provider value={{ products, setProducts }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within ProductProvider');
  return context;
};
