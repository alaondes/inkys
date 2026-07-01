import { CartItem } from '../storefront/Storefront';
import { formatPrice } from '../data/products';

export interface CheckoutData {
  email: string;
  type: string;
  name: string;
  cpf: string;
  gender: string;
  birthDate: string;
  phone: string;
  landline: string;
  address: string;
  paymentMethod: string;
}

export const generateWhatsAppLink = (cart: CartItem[], checkoutData: CheckoutData, phoneNumber: string) => {
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const pixDiscount = 0.10;
  const finalTotal = checkoutData.paymentMethod === 'pix' ? total * (1 - pixDiscount) : total;
  
  let message = `Olá! Gostaria de finalizar meu pedido.\n\n`;
  
  message += `*PEDIDO:*\n`;
  cart.forEach(item => {
    const colorText = item.selectedColor ? ` (${item.selectedColor})` : '';
    message += `${item.quantity}x ${item.name}${colorText} - ${formatPrice(item.price * item.quantity)}\n`;
  });
  
  message += `\n*SUBTOTAL:* ${formatPrice(total)}\n`;
  if (checkoutData.paymentMethod === 'pix') {
     message += `*DESCONTO PIX (10%):* -${formatPrice(total * pixDiscount)}\n`;
  }
  message += `*TOTAL:* ${formatPrice(finalTotal)}\n\n`;
  
  message += `*DADOS DO CLIENTE:*\n`;
  message += `Nome: ${checkoutData.name}\n`;
  message += `E-mail: ${checkoutData.email}\n`;
  message += `Tipo: ${checkoutData.type}\n`;
  message += `CPF: ${checkoutData.cpf}\n`;
  if (checkoutData.gender) message += `Sexo: ${checkoutData.gender}\n`;
  if (checkoutData.birthDate) message += `Data de Nasc.: ${checkoutData.birthDate}\n`;
  message += `Celular: ${checkoutData.phone}\n`;
  if (checkoutData.landline) message += `Fixo: ${checkoutData.landline}\n\n`;
  
  message += `*ENTREGA:*\n`;
  message += `Endereço: ${checkoutData.address}\n\n`;
  
  message += `*PAGAMENTO:*\n`;
  message += `Forma de Pagamento: ${checkoutData.paymentMethod === 'pix' ? 'PIX' : checkoutData.paymentMethod === 'boleto' ? 'Boleto' : 'Cartão de Crédito'}\n`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
};
