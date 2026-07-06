const fullTag = '<PaymentToggle icon={CreditCard} title="Cartão de Crédito" active={paymentMethods.credit} onToggle={() => setPaymentMethods(p => ({...p, credit: !p.credit}))} />';
const match = fullTag.match(/<\/?([a-zA-Z0-9]+)[^>]*>/);
console.log(match[0]);
console.log(match[0].endsWith('/>'));
