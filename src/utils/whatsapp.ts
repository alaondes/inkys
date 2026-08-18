import { CartItem } from '../storefront/Storefront';
import { formatPrice } from '../data/products';

export interface CheckoutData {
  email: string;
  type: string;
  name: string;
  cpf?: string;
  gender: string;
  birthDate: string;
  phone: string;
  paymentMethod: string;
  coupon?: string;
  couponDiscount?: number;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  shippingOption?: any;
  shippingCost?: number;
  address?: string;
  zipCode?: string;
  landline?: string;
}

export const generateWhatsAppLink = (cart: CartItem[], checkoutData: CheckoutData, phoneNumber: string, orderId?: string) => {
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = checkoutData.couponDiscount || 0;
  const subtotalAfterCoupon = Math.max(0, subtotal - discountAmount);
  
  const shippingCost = checkoutData.shippingOption?.price || 0;
  const pixDiscount = 0.10;
  const finalTotal = checkoutData.paymentMethod === 'pix' ? (subtotalAfterCoupon + shippingCost) * (1 - pixDiscount) : (subtotalAfterCoupon + shippingCost);
  
  let message = `Olá! Gostaria de finalizar meu pedido.\n\n`;
  if (orderId) {
    message += `*Nº DO PEDIDO:* ${orderId}\n\n`;
  }
  
  message += `*PEDIDO:*\n`;
  cart.forEach(item => {
    message += `${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}\n`;
  });
  
  message += `\n*SUBTOTAL:* ${formatPrice(subtotal)}\n`;
  if (checkoutData.coupon && checkoutData.couponDiscount) {
    message += `*CUPOM (${checkoutData.coupon}):* -${formatPrice(checkoutData.couponDiscount)}\n`;
  }
  if (checkoutData.shippingOption) {
    message += `*FRETE (${checkoutData.shippingOption.name}):* ${checkoutData.shippingOption.price === 0 ? 'Grátis' : formatPrice(checkoutData.shippingOption.price)}\n`;
  }
  if (checkoutData.paymentMethod === 'pix') { 
    message += `*DESCONTO PIX (10%):* -${formatPrice((subtotalAfterCoupon + shippingCost) * pixDiscount)}\n`;
  }
  message += `*TOTAL:* ${formatPrice(finalTotal)}\n\n`;
  
  message += `*DADOS DO CLIENTE:*\n`;
  message += `Nome: ${checkoutData.name}\n`;
  message += `E-mail: ${checkoutData.email}\n`;
  message += `Tipo: ${checkoutData.type}\n`;
  message += `CPF: ${checkoutData.cpf}\n`;
  if (checkoutData.gender) message += `Sexo: ${checkoutData.gender}\n`;
  if (checkoutData.birthDate) message += `Data de Nasc.: ${checkoutData.birthDate}\n`;
  message += `Celular: ${checkoutData.phone}\n\n`;
  
  message += `*ENTREGA:*\n`;
  message += `CEP: ${checkoutData.cep}\n`;
  message += `Endereço: ${checkoutData.street}, ${checkoutData.number}\n`;
  if (checkoutData.complement) message += `Complemento: ${checkoutData.complement}\n`;
  message += `Bairro: ${checkoutData.neighborhood}\n`;
  message += `Cidade/UF: ${checkoutData.city}/${checkoutData.state}\n\n`;
  
  message += `*PAGAMENTO:*\n`;
  message += `Forma de Pagamento: ${checkoutData.paymentMethod === 'pix' ? 'PIX' : checkoutData.paymentMethod === 'boleto' ? 'Boleto' : 'Cartão de Crédito'}\n`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
};
