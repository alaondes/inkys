export const getWhatsAppNumber = () => {
  return localStorage.getItem('inkys-whatsapp-number') || '5561991365428';
};

export interface CheckoutData {
  name: string;
  address: string;
  paymentMethod: string;
}

import { CartItem } from '../storefront/Storefront';
import { formatPrice } from '../data/products';

export const generateWhatsAppLink = (cart: CartItem[], checkoutData: CheckoutData) => {
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  let message = `Olá Inkys! Gostaria de finalizar meu pedido.\n\n`;
  
  message += `*PEDIDO:*\n`;
  cart.forEach(item => {
    const colorText = item.selectedColor ? ` (${item.selectedColor})` : '';
    message += `${item.quantity}x ${item.name}${colorText} - ${formatPrice(item.price * item.quantity)}\n`;
  });
  
  message += `\n*TOTAL:* ${formatPrice(total)}\n\n`;
  
  message += `*DADOS DO CLIENTE:*\n`;
  message += `Nome: ${checkoutData.name}\n`;
  message += `Endereço: ${checkoutData.address}\n`;
  message += `Forma de Pagamento: ${checkoutData.paymentMethod}\n`;
  
  const encodedMessage = encodeURIComponent(message);
  const number = getWhatsAppNumber();
  return `https://wa.me/${number}?text=${encodedMessage}`;
};
