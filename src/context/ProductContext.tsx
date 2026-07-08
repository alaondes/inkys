import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, INITIAL_PRODUCTS } from '../data/products';
import { collection, onSnapshot, doc, writeBatch, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

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
    const productsRef = collection(db, 'products');
    const path = `products/${product.id}`;
    try {
      // Find maximum order so we can append this product to the end
      const currentMaxOrder = products.reduce((max, p) => (p.order !== undefined && p.order > max ? p.order : max), -1);
      const newOrder = currentMaxOrder + 1;
      
      const docRef = doc(productsRef, product.id);
      await setDoc(docRef, { ...product, order: newOrder });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateProduct = async (product: Product) => {
    const path = `products/${product.id}`;
    try {
      const docRef = doc(db, 'products', product.id);
      await setDoc(docRef, product, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteProduct = async (id: string) => {
    const path = `products/${id}`;
    try {
      const docRef = doc(db, 'products', id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const setProducts = async (newProducts: Product[]) => {
    // Optimistic update
    setProductsState(newProducts);
    
    try {
      const productsRef = collection(db, 'products');
      const batch = writeBatch(db);
      
      // Only update the order field using merge: true to avoid deleting or resetting other fields
      newProducts.forEach((p, index) => {
        const docRef = doc(productsRef, p.id);
        batch.set(docRef, { order: index }, { merge: true });
      });
      
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products (batch)');
    }
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
