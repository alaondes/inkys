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
  shippingCost: number;
  coupon?: string;
  couponDiscount?: number;
}

export const generateWhatsAppLink = (cart: CartItem[], checkoutData: CheckoutData, phoneNumber: string, orderId?: string) => {
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = checkoutData.couponDiscount || 0;
  const subtotalAfterCoupon = Math.max(0, subtotal - discountAmount);
  
  const pixDiscount = 0.10;
  const subtotalWithPix = checkoutData.paymentMethod === 'pix' ? subtotalAfterCoupon * (1 - pixDiscount) : subtotalAfterCoupon;
  const finalTotal = subtotalWithPix + checkoutData.shippingCost;
  
  let message = `Olá! Gostaria de finalizar meu pedido.\n\n`;
  if (orderId) {
    message += `*Nº DO PEDIDO:* ${orderId}\n\n`;
  }
  
  message += `*PEDIDO:*\n`;
  cart.forEach(item => {
    const colorText = item.selectedColor ? ` (Cor: ${item.selectedColor})` : '';
    const fileText = item.fileUrl ? `\n   📎 [Ver Arte: ${item.fileUrl}]` : (item.file ? `\n   📎 [A arte "${item.file.name}" será enviada a seguir no chat]` : '');
    const customText = item.customText ? `\n   💬 Texto: "${item.customText}"` : '';
    const customMusic = item.customMusic ? `\n   🎵 Música: ${item.customMusic}` : '';
    const customImage = item.customImage ? `\n   🖼️ [Foto Personalizada Inclusa no Pedido]` : '';
    
    message += `${item.quantity}x ${item.name}${colorText} - ${formatPrice(item.price * item.quantity)}${fileText}${customText}${customMusic}${customImage}\n`;
  });
  
  message += `\n*SUBTOTAL:* ${formatPrice(subtotal)}\n`;
  if (checkoutData.coupon && checkoutData.couponDiscount) {
    message += `*CUPOM (${checkoutData.coupon}):* -${formatPrice(checkoutData.couponDiscount)}\n`;
  }
  if (checkoutData.paymentMethod === 'pix') { 
    message += `*DESCONTO PIX (10%):* -${formatPrice(subtotalAfterCoupon * pixDiscount)}\n`;
  }
  if (checkoutData.shippingCost > 0) {
    message += `*FRETE:* ${formatPrice(checkoutData.shippingCost)}\n`;
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
