import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, INITIAL_PRODUCTS } from '../data/products';
import { collection, onSnapshot, doc, writeBatch, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import toast from 'react-hot-toast';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

interface ProductContextType {
  products: Product[];
  setProducts: (products: Product[]) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  isLoading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const getInitialProducts = (): Product[] => {
  try {
    const cached = localStorage.getItem('inkys-products');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached products', e);
      }
    }
  } catch (err) {
    console.warn('localStorage access denied', err);
  }
  return INITIAL_PRODUCTS;
};

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProductsState] = useState<Product[]>(getInitialProducts);
  const [isLoading, setIsLoading] = useState(true);

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

    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const fbProducts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      
      // Sort by order field if available, else fallback to id
      fbProducts.sort((a: any, b: any) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        return a.id.localeCompare(b.id);
      });
      
      if (fbProducts.length > 0) {
        setProductsState(fbProducts);
        try {
          localStorage.setItem('inkys-products', JSON.stringify(fbProducts));
        } catch (e) {
          // ignore
        }
      } else {
        setProductsState([]);
        try {
          localStorage.setItem('inkys-products', JSON.stringify([]));
        } catch (e) {
          // ignore
        }
      }
      clearTimeout(timeoutId);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products', false);
      
      // Fallback to local storage or INITIAL_PRODUCTS
      let fallbackProducts = INITIAL_PRODUCTS;
      try {
        const saved = localStorage.getItem('inkys-products');
        if (saved) {
           fallbackProducts = JSON.parse(saved);
        }
      } catch (e) {
        // ignore
      }
      setProductsState(fallbackProducts);
      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null, shouldThrow: boolean = true) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
      },
      operationType,
      path
    };
    if (shouldThrow) {
      console.error('Firestore Error: ', JSON.stringify(errInfo));
      throw new Error(JSON.stringify(errInfo));
    } else {
      console.warn('Firestore Warning (handled gracefully): ', errInfo.error);
    }
  };

  const addProduct = async (product: Product) => {
    // Find maximum order so we can append this product to the end
    const currentMaxOrder = products.reduce((max, p) => (p.order !== undefined && p.order > max ? p.order : max), -1);
    const newOrder = currentMaxOrder + 1;
    const finalProduct = { ...product, order: newOrder };

    // Optimistic local update
    setProductsState(prev => {
      const newProducts = [...prev, finalProduct];
      localStorage.setItem('inkys-products', JSON.stringify(newProducts));
      return newProducts;
    });

    const productsRef = collection(db, 'products');
    const path = `products/${product.id}`;
    const docRef = doc(productsRef, product.id);
    try {
      await setDoc(docRef, finalProduct);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, true);
    }
  };

  const updateProduct = async (product: Product) => {
    // Optimistic local update
    setProductsState(prev => {
      const newProducts = prev.map(p => p.id === product.id ? product : p);
      localStorage.setItem('inkys-products', JSON.stringify(newProducts));
      return newProducts;
    });

    const path = `products/${product.id}`;
    const docRef = doc(db, 'products', product.id);
    try {
      await setDoc(docRef, product, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path, true);
    }
  };

  const deleteProduct = async (id: string) => {
    // Optimistic local update
    setProductsState(prev => {
      const newProducts = prev.filter(p => p.id !== id);
      localStorage.setItem('inkys-products', JSON.stringify(newProducts));
      return newProducts;
    });

    const path = `products/${id}`;
    const docRef = doc(db, 'products', id);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path, true);
    }
  };

  const setProducts = async (newProducts: Product[]) => {
    // Optimistic update
    setProductsState(newProducts);
    localStorage.setItem('inkys-products', JSON.stringify(newProducts));
    
    const productsRef = collection(db, 'products');
    const batch = writeBatch(db);
    newProducts.forEach((p, index) => {
      const docRef = doc(productsRef, p.id);
      batch.set(docRef, { order: index }, { merge: true });
    });
    batch.commit().catch(error => handleFirestoreError(error, OperationType.WRITE, 'products (batch)', false));
  };

  return (
    <ProductContext.Provider value={{ products, setProducts, addProduct, updateProduct, deleteProduct, isLoading }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within ProductProvider');
  return context;
};
