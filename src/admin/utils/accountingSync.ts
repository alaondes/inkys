import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface OrderSyncItem {
  name: string;
  quantity: number;
  price: number;
  customText?: string;
}

export interface OrderForSync {
  id: string;
  customer: string;
  total: number;
  date?: any;
  paymentMethod?: string;
  items?: OrderSyncItem[];
  shippingInfo?: any;
}

/**
 * Calculates estimated m² and material cost (CPV) for a list of order items
 */
export function calculateOrderCPV(items: OrderSyncItem[] = []): { totalCPV: number; totalM2: number; details: string } {
  let totalCPV = 0;
  let totalM2 = 0;
  const itemBreakdown: string[] = [];

  items.forEach(item => {
    const qty = Number(item.quantity) || 1;
    const itemPrice = Number(item.price) || 0;

    // Check if custom text or name contains dimension pattern like "100x200cm" or "1.5m x 2.0m" or "m2"
    const text = `${item.name} ${item.customText || ''}`.toLowerCase();
    
    // Pattern matches: "100x200", "100 x 200", "1,5x2,0m", "1.5m x 2.0m"
    const cmMatch = text.match(/(\d+[,.]?\d*)\s*(cm|m)?\s*x\s*(\d+[,.]?\d*)\s*(cm|m)?/i);
    let m2 = 0;

    if (cmMatch) {
      let dim1 = parseFloat(cmMatch[1].replace(',', '.'));
      let unit1 = cmMatch[2] || 'cm';
      let dim2 = parseFloat(cmMatch[3].replace(',', '.'));
      let unit2 = cmMatch[4] || unit1 || 'cm';

      if (unit1 === 'cm' && dim1 > 10) dim1 = dim1 / 100;
      if (unit2 === 'cm' && dim2 > 10) dim2 = dim2 / 100;

      m2 = Math.max(0.01, dim1 * dim2) * qty;
    }

    if (m2 > 0) {
      // Estimated base material cost per m² (paper/banner/vinyl/ink): R$ 18.50/m²
      const costPerM2 = 18.50;
      const itemCost = m2 * costPerM2;
      totalM2 += m2;
      totalCPV += itemCost;
      itemBreakdown.push(`${item.name} (${m2.toFixed(2)}m² x R$ 18.50 = R$ ${itemCost.toFixed(2)})`);
    } else {
      // Standard percentage estimation for non-m² graphic goods (30% CPV ratio)
      const itemCost = (itemPrice * qty) * 0.28;
      totalCPV += itemCost;
      itemBreakdown.push(`${item.name} (CPV padrão 28% = R$ ${itemCost.toFixed(2)})`);
    }
  });

  return {
    totalCPV: Math.max(1.0, totalCPV),
    totalM2,
    details: itemBreakdown.join('; ')
  };
}

/**
 * Automatically syncs an order to Accounting (Revenue + CPV + NFe)
 */
export async function syncOrderToAccounting(order: OrderForSync): Promise<{ success: boolean; message: string }> {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Sync Order Revenue Entry (3.1 Receita de Impressão)
    const revenueEntryId = `ent_ord_${order.id}`;
    const revenuePayload = {
      id: revenueEntryId,
      date: todayStr,
      description: `Venda e-Commerce / Ordem #${order.id} (${order.customer})`,
      type: 'receita',
      category: '3.1 Vendas de Impressões & Comunicação Visual',
      amount: Number(order.total) || 0,
      debitAccount: '1.1.02 Bancos Conta Movimento (PIX)',
      creditAccount: '3.1 Vendas de Impressões & Comunicação Visual',
      paymentMethod: order.paymentMethod || 'PIX',
      documentRef: `ORD-${order.id}`,
      notes: `Lançamento automático de receita gerado pela conclusão do pedido #${order.id}.`,
      isAutoSynced: true
    };
    await setDoc(doc(db, 'accounting_entries', revenueEntryId), revenuePayload);

    // 2. Calculate and Sync CPV (4.1 Baixa de Insumos por m²)
    const cpvResult = calculateOrderCPV(order.items || []);
    const cpvEntryId = `ent_cpv_${order.id}`;
    const cpvPayload = {
      id: cpvEntryId,
      date: todayStr,
      description: `Baixa de Insumos (CPV por m²) - Ordem #${order.id}`,
      type: 'despesa',
      category: '4.1 Custo dos Insumos e Materiais Vendidos (CPV)',
      amount: Number(cpvResult.totalCPV.toFixed(2)),
      debitAccount: '4.1 Custo dos Insumos (CPV)',
      creditAccount: '1.2 Estoque de Insumos e Materiais',
      paymentMethod: 'Automático',
      documentRef: `CPV-${order.id}`,
      notes: `Baixa proporcional de matérias-primas (${cpvResult.totalM2.toFixed(2)}m² total). Detalhes: ${cpvResult.details}`,
      isAutoSynced: true
    };
    await setDoc(doc(db, 'accounting_entries', cpvEntryId), cpvPayload);

    // 3. Check Fiscal / SEFAZ Settings & Auto-Emit NFe
    try {
      const fiscalSnap = await getDoc(doc(db, 'accounting_settings', 'main'));
      if (fiscalSnap.exists()) {
        const fiscalSettings = fiscalSnap.data();
        if (fiscalSettings.autoTransmitOnOrderCompletion) {
          const invNum = `NF-${Math.floor(100000 + Math.random() * 900000)}`;
          const accessKey = `3526${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`;
          const total = Number(order.total) || 0;
          const tax = total * ((fiscalSettings.simplesRate || 6.0) / 100);
          const envName = (fiscalSettings.sefazEnvironment || 'homologacao').toUpperCase();
          const provider = fiscalSettings.sefazApiProvider || 'focus_nfe';

          const invoiceDoc = {
            id: `inv_ord_${order.id}`,
            number: invNum,
            type: 'NFe',
            customerName: order.customer,
            customerCnpjCpf: order.shippingInfo?.cpf || '000.000.000-00',
            orderId: order.id,
            date: todayStr,
            totalAmount: total,
            taxAmount: tax,
            status: 'emitida',
            accessKey: accessKey,
            xmlContent: `<?xml version="1.0" encoding="UTF-8"?><NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe${accessKey}"><emit><CNPJ>${fiscalSettings.cnpj}</CNPJ><xNome>${fiscalSettings.companyName}</xNome></emit><dest><xNome>${order.customer}</xNome></dest><total><ICMSTot><vNF>${total.toFixed(2)}</vNF></ICMSTot></total><sefazInfo><provedor>${provider}</provedor><ambiente>${envName}</ambiente></sefazInfo></infNFe></NFe>`
          };
          await setDoc(doc(db, 'accounting_invoices', invoiceDoc.id), invoiceDoc);

          const vaultDoc = {
            id: `xml_ord_${order.id}`,
            type: 'saida',
            fileName: `${invNum}_${accessKey}.xml`,
            accessKey: accessKey,
            issuer: fiscalSettings.companyName || 'Sua Gráfica',
            recipient: order.customer,
            value: total,
            date: todayStr,
            xmlData: invoiceDoc.xmlContent
          };
          await setDoc(doc(db, 'accounting_xml_vault', vaultDoc.id), vaultDoc);
        }
      }
    } catch (e) {
      console.warn("Auto NFe emission warning:", e);
    }

    return {
      success: true,
      message: `Pedido #${order.id} sincronizado com a Contabilidade! Receita e CPV (R$ ${cpvResult.totalCPV.toFixed(2)}) lançados.`
    };
  } catch (err: any) {
    console.error("Error in syncOrderToAccounting:", err);
    return {
      success: false,
      message: err.message || "Erro ao sincronizar com a Contabilidade."
    };
  }
}
