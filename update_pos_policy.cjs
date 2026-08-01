const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

const stateOld = `  const [notes, setNotes] = useState('');`;
const stateNew = `  const [notes, setNotes] = useState('');
  const [paymentPolicy, setPaymentPolicy] = useState(\`Política de Pagamento

Para garantir a qualidade do atendimento e o início da produção do seu pedido, trabalhamos com a seguinte forma de pagamento:

50% do valor no momento da confirmação do pedido, destinados à aquisição de materiais, reserva da produção e desenvolvimento do projeto.
50% restantes na entrega do produto, antes da retirada ou do envio.

Essa política nos permite manter um processo organizado, assegurar a disponibilidade dos materiais e oferecer um serviço com a qualidade e o prazo que nossos clientes esperam.

Agradecemos pela compreensão, confiança e preferência. Estamos à disposição para esclarecer qualquer dúvida e tornar sua experiência a melhor possível.\`);`;

content = content.replace(stateOld, stateNew);

const orderDataOld = `        total,
        status,
        items: cart,
        notes: notes,
        shippingMode,
        shippingCost,`;
const orderDataNew = `        total,
        status,
        items: cart,
        notes: notes,
        paymentPolicy: paymentPolicy,
        shippingMode,
        shippingCost,`;
content = content.replace(orderDataOld, orderDataNew);

const uiInputOld = `            <textarea
              placeholder="Observações do pedido/orçamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors min-h-[60px] resize-y"
            />
          </div>`;
const uiInputNew = `            <textarea
              placeholder="Observações do pedido/orçamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors min-h-[60px] resize-y"
            />
            <textarea
              placeholder="Política de Pagamento"
              value={paymentPolicy}
              onChange={(e) => setPaymentPolicy(e.target.value)}
              className="w-full text-sm bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors min-h-[120px] resize-y mt-3"
            />
          </div>`;
content = content.replace(uiInputOld, uiInputNew);

const whatsappOld = `                    if (savedOrder.notes) {
                      message += \`*Observações:*\\n\${savedOrder.notes}\\n\\n\`;
                    }
                    
                    message += \`Qualquer dúvida, estamos à disposição!\`;`;
const whatsappNew = `                    if (savedOrder.notes) {
                      message += \`*Observações:*\\n\${savedOrder.notes}\\n\\n\`;
                    }
                    if (savedOrder.paymentPolicy) {
                      message += \`*\${savedOrder.paymentPolicy}*\\n\\n\`;
                    }
                    
                    message += \`Qualquer dúvida, estamos à disposição!\`;`;
content = content.replace(whatsappOld, whatsappNew);

const receiptOld = `                    {savedOrder.notes && (
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                        <h4 className="text-xs font-bold text-yellow-800 uppercase mb-1">Observações</h4>
                        <p className="text-xs text-yellow-900 whitespace-pre-wrap">{savedOrder.notes}</p>
                      </div>
                    )}`;
const receiptNew = `                    {savedOrder.notes && (
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-100 mb-3">
                        <h4 className="text-xs font-bold text-yellow-800 uppercase mb-1">Observações</h4>
                        <p className="text-xs text-yellow-900 whitespace-pre-wrap">{savedOrder.notes}</p>
                      </div>
                    )}
                    {savedOrder.paymentPolicy && (
                      <div className="bg-blue-50 p-3 rounded border border-blue-100">
                        <p className="text-[11px] text-blue-900 whitespace-pre-wrap">{savedOrder.paymentPolicy}</p>
                      </div>
                    )}`;
content = content.replace(receiptOld, receiptNew);

fs.writeFileSync('src/admin/views/Pos.tsx', content);
