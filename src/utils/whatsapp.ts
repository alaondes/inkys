import { CartItem } from '../storefront/Storefront';
import { formatPrice } from '../data/products';

export interface CheckoutData {
  name: string;
  address: string;
  paymentMethod: string;
}

export const generateWhatsAppLink = (cart: CartItem[], checkoutData: CheckoutData, phoneNumber: string) => {
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
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
};
