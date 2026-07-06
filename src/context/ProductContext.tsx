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
      try {
        const snap = await getDocs(productsRef);
        if (snap.empty) {
          const batch = writeBatch(db);
          INITIAL_PRODUCTS.forEach((p, index) => {
            const docRef = doc(productsRef, p.id);
            batch.set(docRef, { ...p, order: index });
          });
          await batch.commit();
        }
      } catch (error) {
        console.warn("Could not seed initial products offline or due to permissions:", error);
      }
    };
    initData();

    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const fbProducts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      
      // Sort by order field if available, else fallback to id
      fbProducts.sort((a: any, b: any) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        return a.id.localeCompare(b.id);
      });
      
      if (fbProducts.length > 0) {
        setProductsState(fbProducts);
      } else {
        setProductsState([]);
      }
      setInitialized(true);
    }, (error) => {
      console.error("Firestore error:", error);
    });

    return () => unsubscribe();
  }, []);

  const setProducts = async (newProducts: Product[]) => {
    // Optimistic update
    setProductsState(newProducts);
    
    // This function will now update Firestore, handling additions, updates, deletions, and ordering
    try {
      const productsRef = collection(db, 'products');
      const snap = await getDocs(productsRef);
      const existingIds = snap.docs.map(d => d.id);
      const newIds = newProducts.map(p => p.id);
      
      const batch = writeBatch(db);
      
      // Delete products that are no longer in newProducts
      existingIds.forEach(id => {
        if (!newIds.includes(id)) {
          batch.delete(doc(productsRef, id));
        }
      });

      // Update/Add products with their new order
      newProducts.forEach((p, index) => {
        const docRef = doc(productsRef, p.id);
        batch.set(docRef, { ...p, order: index });
      });
      
      await batch.commit();
    } catch (e) {
      console.error("Error saving products:", e);
    }
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
