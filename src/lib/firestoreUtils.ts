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
