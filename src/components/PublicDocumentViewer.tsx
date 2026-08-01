import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Printer, FileText, Calendar, CheckCircle2, ChevronLeft, CreditCard, Clock, AlertCircle, Download } from 'lucide-react';
import { formatPrice } from '../data/products';

const THEMES = {
  charcoal: {
    name: 'Grafite Clássico',
    primary: 'text-gray-900',
    border: 'border-gray-900',
    accentBorder: 'border-gray-200',
    bg: 'bg-gray-50',
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    accentText: 'text-gray-600',
    fillBg: 'bg-gray-900',
    fillText: 'text-white',
    primaryHex: '#111827',
  },
  blue: {
    name: 'Azul Corporativo',
    primary: 'text-blue-700',
    border: 'border-blue-700',
    accentBorder: 'border-blue-100',
    bg: 'bg-blue-50/20',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    accentText: 'text-blue-600',
    fillBg: 'bg-blue-700',
    fillText: 'text-white',
    primaryHex: '#1d4ed8',
  },
  pink: {
    name: 'Rosa Chic',
    primary: 'text-pink-600',
    border: 'border-pink-600',
    accentBorder: 'border-pink-100',
    bg: 'bg-pink-50/20',
    badge: 'bg-pink-100 text-pink-700 border-pink-200',
    accentText: 'text-pink-500',
    fillBg: 'bg-pink-600',
    fillText: 'text-white',
    primaryHex: '#db2777',
  },
  emerald: {
    name: 'Verde Esmeralda',
    primary: 'text-emerald-700',
    border: 'border-emerald-700',
    accentBorder: 'border-emerald-100',
    bg: 'bg-emerald-50/20',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    accentText: 'text-emerald-600',
    fillBg: 'bg-emerald-700',
    fillText: 'text-white',
    primaryHex: '#047857',
  },
  amber: {
    name: 'Dourado Elegante',
    primary: 'text-amber-700',
    border: 'border-amber-700',
    accentBorder: 'border-amber-100',
    bg: 'bg-amber-50/20',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    accentText: 'text-amber-600',
    fillBg: 'bg-amber-700',
    fillText: 'text-white',
    primaryHex: '#b45309',
  }
};

const FONTS = {
  sans: { name: 'Inter (Sans)', class: 'font-sans' },
  serif: { name: 'Playfair (Serif)', class: 'font-serif' },
  mono: { name: 'JetBrains (Mono)', class: 'font-mono text-sm' }
};

export function PublicDocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<any>(null);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  useEffect(() => {
    async function loadDocument() {
      if (!id) {
        setError('ID do documento inválido.');
        setLoading(false);
        return;
      }

      try {
        // First try to load from 'documents'
        const docRef = doc(db, 'documents', id);
        const docSnap = await getDoc(docRef);

        let activeSettings: any = null;
        try {
          const settingsSnap = await getDoc(doc(db, 'config', 'settings'));
          if (settingsSnap.exists()) {
            activeSettings = settingsSnap.data();
          }
        } catch (settingsErr) {
          console.warn('Failed to load store settings:', settingsErr);
        }

        if (docSnap.exists()) {
          setDocumentData({ id: docSnap.id, ...docSnap.data() });
        } else {
          // If not in 'documents', try to load from 'orders'
          const orderRef = doc(db, 'orders', id);
          const orderSnap = await getDoc(orderRef);

          if (!orderSnap.exists()) {
            setError('Documento não encontrado ou ID expirado.');
            setLoading(false);
            return;
          }

          const orderData = orderSnap.data();
          
          // Format date if it is a Firestore Timestamp
          let formattedDate = orderData.date || '';
          if (orderData.date?.toDate) {
            const dt = orderData.date.toDate();
            formattedDate = dt.toLocaleDateString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric'
            });
          }

          // Map the order data to match the expected Document fields
          const mappedDoc = {
            id: orderSnap.id,
            type: orderData.status === 'Orçamento' ? 'quote' : 'receipt',
            date: formattedDate,
            customerName: orderData.customer || 'Cliente',
            customerDoc: orderData.shippingInfo?.cpf || orderData.receipt?.customerDoc || '',
            customerEmail: orderData.email || '',
            customerPhone: orderData.phone || orderData.celular || '',
            shippingInfo: orderData.shippingInfo || null,
            shippingMode: orderData.shippingMode || null,
            items: (orderData.items || []).map((item: any) => ({
              description: item.name || item.description || '',
              quantity: item.quantity || 1,
              unitPrice: item.price || item.unitPrice || 0,
              image: item.image || item.customImage || ''
            })),
            discount: orderData.discount || 0,
            subtotal: orderData.subtotal || orderData.total || 0,
            total: orderData.total || 0,
            notes: orderData.notes || '',
            paymentMethod: orderData.shippingInfo?.paymentMethod || orderData.paymentMethod || '',
            paymentConditions: orderData.paymentConditions || '',
            installments: orderData.installments || 1,
            downPayment: orderData.downPayment || 0,
            paymentPolicy: orderData.paymentPolicy || activeSettings?.paymentPolicy || `Política de Pagamento

Para garantir a qualidade do atendimento e o início da produção do seu pedido, trabalhamos com as seguintes condições:

- Sinal de 50% para início da produção/confirmação do pedido.
- 50% restantes no momento da entrega/envio do produto.

Agradecemos pela confiança e preferência!`,
            status: orderData.status === 'Orçamento' ? 'Pendente' : 'Aprovado',
            emitter: {
              name: activeSettings?.storeName || 'Inkys',
              doc: activeSettings?.cnpj || activeSettings?.cpf || '',
              address: activeSettings?.address || '',
              logoUrl: activeSettings?.logoUrl || ''
            },
            design: {
              theme: 'charcoal',
              font: 'sans',
              watermark: ''
            }
          };

          setDocumentData(mappedDoc);
        }

        // Load catalog products for fallback images
        try {
          const productsSnap = await getDocs(collection(db, 'products'));
          const productsList = productsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCatalogProducts(productsList);
        } catch (err) {
          console.warn('Failed to load products for image mapping, using stored or default images.', err);
        }

      } catch (err: any) {
        console.error('Error fetching document:', err);
        setError(`Ocorreu um erro ao carregar o documento: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    }

    loadDocument();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!documentData) return;
    const element = document.getElementById('printable-document');
    if (!element) {
      alert("Erro: Área de impressão não encontrada.");
      return;
    }
    
    // Temporarily set a fixed width to ensure the PDF layout is correctly proportioned
    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;
    const originalHeight = element.style.height;
    
    element.style.width = '800px';
    element.style.maxWidth = '800px';
    element.style.height = 'max-content';
    
    // If parent has overflow, it might clip. Temporarily change parent overflow
    const parent = element.parentElement;
    const originalParentOverflow = parent ? parent.style.overflow : '';
    if (parent) {
      parent.style.overflow = 'visible';
    }
    
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

      const opt = {
        margin:       10,
        filename:     `${documentData.type === 'quote' ? 'orcamento' : 'recibo'}-${documentData.id}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: true, windowWidth: 800, scrollY: 0 },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      
      await html2pdf().from(element).set(opt).save();
    } catch (e: any) {
      console.error("Failed to generate PDF", e);
      if (e.message && e.message.includes('Failed to fetch dynamically imported module')) {
        alert("Nova versão detectada. A página será atualizada.");
        window.location.reload();
      } else {
        alert(`Erro ao gerar PDF: ${e.message || 'Erro desconhecido'}`);
      }
    } finally {
      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;
      element.style.height = originalHeight;
      if (parent) {
        parent.style.overflow = originalParentOverflow;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">
            Carregando documento...
          </p>
        </div>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-md space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-black uppercase text-gray-900">Erro ao Abrir Documento</h2>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            {error || 'Não foi possível carregar os detalhes do orçamento ou recibo solicitado.'}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-colors"
          >
            Ir para a Loja
          </a>
        </div>
      </div>
    );
  }

  const {
    type,
    date,
    customerName,
    customerDoc,
    customerEmail,
    customerPhone,
    items = [],
    discount = 0,
    subtotal = 0,
    total = 0,
    notes,
    paymentMethod,
    installments,
    downPayment,
    paymentConditions,
    paymentPolicy,
    validUntil,
    status,
    emitter = {},
    design = {},
    shippingInfo = null,
    shippingMode = null
  } = documentData;

  const documentTheme = design.theme || 'charcoal';
  const documentFont = design.font || 'sans';
  const watermarkText = design.watermark || '';

  const selectedTheme = THEMES[documentTheme as keyof typeof THEMES] || THEMES.charcoal;
  const fontClass = FONTS[documentFont as keyof typeof FONTS]?.class || 'font-sans';

  // Helper to find image URL
  const getProductImage = (itemDescription: string, storedImage?: string) => {
    if (storedImage) return storedImage;
    const matched = catalogProducts.find(
      p => p.name === itemDescription || p.name?.toLowerCase() === itemDescription?.toLowerCase()
    );
    return matched?.image || '';
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      
      {/* Floating Header Actions - Screen Only */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 py-3.5 px-4 shadow-xs print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-pink-100 text-pink-700 p-1.5 rounded-lg">
              <FileText size={18} />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-gray-900 tracking-wide">
                {type === 'quote' ? 'Orçamento' : 'Recibo Digital'}
              </p>
              <p className="text-[10px] font-bold text-gray-500">
                Emitido por: {emitter.name || 'Inkys'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs shrink-0"
            >
              <Printer size={14} /> Imprimir
            </button>
            <button
              onClick={handleDownloadPDF}
              className={`flex items-center gap-1.5 ${selectedTheme.bg} ${selectedTheme.primary} hover:opacity-80 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs shrink-0`}
            >
              <Download size={14} /> Baixar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 mt-8 print:mt-0">
        
        {/* Printable Document Area */}
        <div id="printable-document" className={`bg-white p-6 sm:p-12 rounded-2xl border border-gray-200/80 shadow-md print:shadow-none print:border-none print:p-0 min-h-[750px] relative overflow-hidden flex flex-col justify-between ${fontClass}`}>
          
          {/* Watermark */}
          {watermarkText && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.06] z-0">
              <span className="text-6xl sm:text-[7.5rem] font-black tracking-widest uppercase rotate-[25deg] border-8 border-gray-900 px-8 py-2 rounded-3xl">
                {watermarkText}
              </span>
            </div>
          )}

          <div className="relative z-10 space-y-8">
            
            {/* Header: Store details and Document Info */}
            <div className={`flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 pb-6 ${selectedTheme.border}`}>
              <div className="space-y-3">
                {emitter.logoUrl ? (
                  <img src={emitter.logoUrl} alt="Logo" className="h-16 object-contain mb-1 max-w-[200px]" referrerPolicy="no-referrer" />
                ) : (
                  <h2 className="text-2xl font-black tracking-tight uppercase text-gray-900">
                    {emitter.name || 'Inkys'}
                  </h2>
                )}
                
                <div className="text-[11px] text-gray-500 space-y-0.5 font-medium leading-relaxed">
                  {emitter.name && <p className="font-extrabold text-gray-700">{emitter.name}</p>}
                  {emitter.doc && <p>CNPJ/CPF: {emitter.doc}</p>}
                  {emitter.address && <p>{emitter.address}</p>}
                </div>
              </div>
              
              <div className="text-left sm:text-right w-full sm:w-auto space-y-2">
                <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                  type === 'quote' 
                    ? 'bg-pink-50 text-pink-800 border-pink-100' 
                    : 'bg-green-50 text-green-800 border-green-100'
                }`}>
                  {type === 'quote' ? 'Orçamento' : 'Recibo'}
                </span>
                <h1 className={`text-3xl font-black uppercase tracking-wider ${selectedTheme.primary}`}>
                  {type === 'quote' ? 'Proposta Comercial' : 'Recibo de Pagamento'}
                </h1>
                <div className="text-xs text-gray-600 space-y-1 font-medium">
                  <p><strong>Data de Emissão:</strong> {date ? date.split('-').reverse().join('/') : ''}</p>
                  {type === 'quote' && validUntil && (
                    <p className="text-red-600"><strong>Válido até:</strong> {validUntil.split('-').reverse().join('/')}</p>
                  )}
                  <p className="text-[10px] text-gray-400">Doc ID: #{id?.substring(0, 10)}</p>
                </div>
              </div>
            </div>

            {/* Client / Recipient Details */}
            <div className={`p-5 rounded-xl border border-gray-100 ${selectedTheme.bg} print:bg-transparent print:p-0 print:border-b print:border-gray-200 print:rounded-none`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Destinatário / Cliente</p>
              <p className="text-lg font-extrabold text-gray-900">{customerName || 'Cliente Consumidor'}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs text-gray-600 font-semibold">
                {customerDoc && (
                  <p><strong>CPF/CNPJ:</strong> {customerDoc}</p>
                )}
                {customerPhone && (
                  <p><strong>WhatsApp:</strong> {customerPhone}</p>
                )}
                {customerEmail && (
                  <p className="truncate"><strong>E-mail:</strong> {customerEmail}</p>
                )}
              </div>
            </div>

            {shippingMode && shippingMode !== 'retirada' && shippingInfo && (
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Endereço de Entrega</h3>
                <p className="text-xs text-gray-700 font-medium whitespace-pre-line leading-relaxed">
                  {shippingInfo.street}, {shippingInfo.number} {shippingInfo.complement ? `- ${shippingInfo.complement}` : ''}
                  <br />
                  {shippingInfo.neighborhood} - {shippingInfo.city}/{shippingInfo.state}
                  <br />
                  CEP: {shippingInfo.zipCode}
                </p>
              </div>
            )}

            {/* Items Table with Product Images */}
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b-2 text-xs font-black uppercase tracking-wider text-gray-400 ${selectedTheme.border}`}>
                      <th className="py-3 pl-2">Descrição dos Itens / Serviços</th>
                      <th className="py-3 text-center w-16">Qtd</th>
                      <th className="py-3 text-right w-24">V. Unit.</th>
                      <th className="py-3 text-right pr-2 w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter((item: any) => item.description || item.unitPrice > 0).map((item: any, idx: number) => {
                      const itemImg = getProductImage(item.description, item.image);
                      return (
                        <tr key={idx} className="border-b border-gray-100 text-xs">
                          <td className="py-3 pl-2 font-semibold text-gray-900 leading-relaxed">
                            <div className="flex items-center gap-3">
                              {itemImg && (
                                <img 
                                  src={itemImg} 
                                  alt={item.description} 
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-2xs shrink-0" 
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <div>
                                <p className="font-extrabold text-gray-900">{item.description || 'Item sem descrição'}</p>
                                {catalogProducts.find(p => p.name === item.description)?.sku && (
                                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                    SKU: {catalogProducts.find(p => p.name === item.description)?.sku}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-center text-gray-600 font-medium">{item.quantity}</td>
                          <td className="py-3 text-right text-gray-600 font-semibold">{formatPrice(item.unitPrice)}</td>
                          <td className="py-3 text-right pr-2 font-extrabold text-gray-900">{formatPrice(item.quantity * item.unitPrice)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary details & Payment terms */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-gray-50">
              
              {/* Payment conditions information */}
              <div className="text-xs space-y-2.5 max-w-sm flex-1">
                {paymentMethod && (
                  <p className="text-gray-700">
                    <strong>Meio de Pagamento:</strong>{' '}
                    <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md font-bold">{paymentMethod}</span>
                  </p>
                )}
                {paymentConditions && (
                  <p className="text-gray-600 leading-relaxed">
                    <strong>Condições de Pagamento:</strong> {paymentConditions}
                  </p>
                )}
                {type === 'quote' && (
                  <div className="flex items-center gap-1.5">
                    <strong>Status:</strong>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      status === 'Aprovado' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : status === 'Rejeitado' 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {status || 'Pendente'}
                    </span>
                  </div>
                )}
              </div>

              {/* Pricing Totals */}
              <div className="w-full sm:w-64 space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold mb-2">
                    <span>Desconto:</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                
                {paymentMethod && (
                  <div className="flex justify-between text-gray-700 font-semibold border-t border-dashed border-gray-200 pt-2 mb-2">
                    <span>Forma de Pagamento:</span>
                    <span>
                      {paymentMethod}
                      {paymentMethod === 'Cartão de Crédito' && installments && installments > 1 ? ` (${installments}x)` : ''}
                      {(paymentMethod === 'Pix' || paymentMethod === 'Dinheiro') && paymentConditions ? ` - ${paymentConditions}` : ''}
                    </span>
                  </div>
                )}

                {downPayment && downPayment > 0 ? (
                  <>
                    <div className="flex justify-between text-green-600 font-semibold mb-1">
                      <span>Entrada:</span>
                      <span>-{formatPrice(downPayment)}</span>
                    </div>
                    <div className="flex justify-between text-blue-600 font-semibold mb-2">
                      <span>Falta Pagar:</span>
                      <span>{formatPrice(total - downPayment)}</span>
                    </div>
                  </>
                ) : null}

                <div className={`flex justify-between text-lg font-black border-t-2 pt-2 text-gray-900 ${selectedTheme.border}`}>
                  <span>Total Geral:</span>
                  <span className={`${selectedTheme.primary}`}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Policy Block (Política de Pagamento) */}
            {paymentPolicy && (
              <div className="bg-blue-50/40 border border-blue-100 p-5 rounded-2xl space-y-2 mt-4 print:mt-6">
                <div className="flex items-center gap-1.5 text-blue-900 font-extrabold uppercase tracking-wide text-xs">
                  <CreditCard size={14} className="text-blue-700" />
                  <span>Política de Pagamento</span>
                </div>
                <p className="text-xs text-blue-900/90 whitespace-pre-line font-medium leading-relaxed">
                  {paymentPolicy}
                </p>
              </div>
            )}

            {/* Additional Notes */}
            {notes && (
              <div className="text-xs text-gray-600 border-t border-gray-100 pt-4 bg-gray-50/50 p-4 rounded-xl leading-relaxed">
                <p className="font-extrabold uppercase tracking-wider text-gray-400 mb-1">Observações:</p>
                <p className="whitespace-pre-line font-medium">{notes}</p>
              </div>
            )}

          </div>

          {/* Declaration/Footer Block */}
          <div className="mt-8 border-t border-gray-100 pt-6 text-center text-[10px] text-gray-400 space-y-4">
            {type === 'receipt' ? (
              <p className="font-medium">Recebemos de {customerName || 'Cliente'} a quantia líquida de {formatPrice(total)} descrita neste documento.</p>
            ) : (
              <p className="font-medium">Este documento é uma proposta comercial sujeita a confirmação e aprovação.</p>
            )}
            <p className="text-[9px] text-gray-300">Documento gerado eletronicamente por {emitter.name || 'Inkys'}</p>
            
            {/* Centered signature logo */}
            <div className="flex justify-center pt-2">
              {emitter.logoUrl ? (
                <img src={emitter.logoUrl} alt="Logo Rodapé" className="h-12 object-contain opacity-40 grayscale" referrerPolicy="no-referrer" />
              ) : (
                <p className="text-[12px] font-black uppercase tracking-widest text-gray-300">{emitter.name || 'Inkys'}</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
