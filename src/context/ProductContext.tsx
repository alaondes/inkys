import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, INITIAL_PRODUCTS } from '../data/products';
import { collection, onSnapshot, setDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ProductContextType {
  products: Product[];
  setProducts: (products: Product[]) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProductsState] = useState<Product[]>(INITIAL_PRODUCTS);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const productsRef = collection(db, 'products');
    
    // Seed initial products if collection is empty
    const initData = async () => {
      const snap = await getDocs(productsRef);
      if (snap.empty) {
        const batch = writeBatch(db);
        INITIAL_PRODUCTS.forEach(p => {
          const docRef = doc(productsRef, p.id);
          batch.set(docRef, p);
        });
        await batch.commit();
      }
    };
    initData();

    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const fbProducts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      if (fbProducts.length > 0) {
        setProductsState(fbProducts);
      }
      setInitialized(true);
    }, (error) => {
      console.error("Firestore error:", error);
    });

    return () => unsubscribe();
  }, []);

  const setProducts = (newProducts: Product[]) => {
    // This function will now update Firestore, which in turn updates the state via onSnapshot
    const productsRef = collection(db, 'products');
    const batch = writeBatch(db);
    newProducts.forEach(p => {
      const docRef = doc(productsRef, p.id);
      batch.set(docRef, p);
    });
    batch.commit().catch(e => console.error("Error saving products:", e));
  };

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
