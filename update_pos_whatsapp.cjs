const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

const importOld = `import { Search, Plus, Trash2, ShoppingCart, Save, User, FileText, XCircle, Printer, X, Image as ImageIcon, Truck, Store, Edit2 } from 'lucide-react';`;
const importNew = `import { Search, Plus, Trash2, ShoppingCart, Save, User, FileText, XCircle, Printer, X, Image as ImageIcon, Truck, Store, Edit2, MessageCircle } from 'lucide-react';`;
content = content.replace(importOld, importNew);

const btnOld = `              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button 
                  onClick={closeReceipt} 
                  className="text-gray-400 hover:text-gray-900 p-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  title="Fechar e Novo Pedido"
                >
                  <X size={20} />
                </button>
              </div>`;

const btnNew = `              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    let message = \`Olá \${savedOrder.customer || ''}!\\n\\n\`;
                    message += \`Aqui está o resumo do seu *\${savedOrder.status === 'Orçamento' ? 'ORÇAMENTO' : 'PEDIDO'}* #\${savedOrder.id.substring(0, 8)}:\\n\\n\`;
                    
                    savedOrder.items.forEach((item) => {
                      message += \`\${item.quantity}x \${item.name} - \${formatPrice(item.price * item.quantity)}\\n\`;
                    });
                    
                    message += \`\\n*SUBTOTAL:* \${formatPrice(savedOrder.subtotal || savedOrder.total)}\\n\`;
                    if (savedOrder.discount > 0) {
                      message += \`*DESCONTO:* -\${formatPrice(savedOrder.discount)}\\n\`;
                    }
                    if (savedOrder.shippingMode !== 'retirada') {
                      message += \`*FRETE:* \${savedOrder.shippingMode === 'gratis' ? 'Grátis' : formatPrice(savedOrder.shippingCost || 0)}\\n\`;
                    }
                    message += \`*TOTAL:* \${formatPrice(savedOrder.total)}\\n\\n\`;
                    
                    if (savedOrder.notes) {
                      message += \`*Observações:*\\n\${savedOrder.notes}\\n\\n\`;
                    }
                    
                    message += \`Qualquer dúvida, estamos à disposição!\`;
                
                    const encodedMessage = encodeURIComponent(message);
                    const phoneNumber = savedOrder.phone ? savedOrder.phone.replace(/\\D/g, '') : '';
                    
                    if (phoneNumber) {
                      const prefix = phoneNumber.startsWith('55') || phoneNumber.length > 11 ? '' : '55';
                      window.open(\`https://wa.me/\${prefix}\${phoneNumber}?text=\${encodedMessage}\`, '_blank');
                    } else {
                      window.open(\`https://wa.me/?text=\${encodedMessage}\`, '_blank');
                    }
                  }}
                  className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1DA851] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button 
                  onClick={closeReceipt} 
                  className="text-gray-400 hover:text-gray-900 p-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  title="Fechar e Novo Pedido"
                >
                  <X size={20} />
                </button>
              </div>`;

content = content.replace(btnOld, btnNew);

fs.writeFileSync('src/admin/views/Pos.tsx', content);
