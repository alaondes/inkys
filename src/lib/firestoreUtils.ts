import { runTransaction, doc } from 'firebase/firestore';

export const withTimeout = <T>(promise: Promise<T>, ms: number = 3000): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('A operação demorou muito. Verifique sua conexão ou a disponibilidade do banco de dados.'));
    }, ms);
    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(reason => {
        clearTimeout(timer);
        reject(reason);
      });
  });
};

export const generateSequentialId = async (db: any, status: string, storeName?: string): Promise<string> => {
  const counterRef = doc(db, 'counters', 'orders');
  
  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let nextOrderNumber = 1000;
    let nextBudgetNumber = 1000;

    if (counterDoc.exists()) {
      const data = counterDoc.data();
      nextOrderNumber = typeof data.nextOrderNumber === 'number' ? data.nextOrderNumber : 1000;
      nextBudgetNumber = typeof data.nextBudgetNumber === 'number' ? data.nextBudgetNumber : 1000;
    }

    let finalId = '';
    const nameToUse = (storeName || 'Inkys').trim();
    const cleaned = nameToUse.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const prefix = cleaned.substring(0, 3) || 'INK';
    const finalPrefix = prefix.length < 3 ? 'INK' : prefix;

    if (status === 'Orçamento') {
      finalId = `ORC-${nextBudgetNumber}`;
      transaction.set(counterRef, { nextBudgetNumber: nextBudgetNumber + 1 }, { merge: true });
    } else {
      finalId = `${finalPrefix}-${nextOrderNumber}`;
      transaction.set(counterRef, { nextOrderNumber: nextOrderNumber + 1 }, { merge: true });
    }
    return finalId;
  });
};

