export interface PricingRulesConfig {
  // Custos Diretos Padrão (R$)
  defaultPackagingCost: number;     // Embalagens e Etiquetas (R$)
  defaultShippingInCost: number;    // Frete de Entrada / Transporte Fornecedor (R$)
  
  // Custos Variáveis (% sobre a venda)
  taxRatePct: number;               // Impostos sobre Nota Fiscal (%)
  gatewayFeePct: number;            // Taxas de Maquininha / Gateway (%)
  commissionPct: number;            // Comissões de Vendedores ou Marketplaces (%)
  pixFeeRatePct?: number;           // Taxa do PIX (%)
  
  // Despesas Fixas e Estruturais
  fixedCostPct: number;             // % Final de Rateio de Custos Fixos
  
  // Detalhamento de Despesas Fixas Mensais (R$/mês)
  useCalculatedFixedCost?: boolean; // Se true, calcula fixedCostPct com base na estrutura abaixo
  rentCostMonthly?: number;          // Aluguel do espaço ou loja (R$/mês)
  utilitiesCostMonthly?: number;     // Conta de luz, água e internet (R$/mês)
  salariesCostMonthly?: number;      // Salários e pró-labore (R$/mês)
  marketingCostMonthly?: number;     // Marketing, Tráfego Pago e Anúncios (R$/mês)
  softwareAccountingCostMonthly?: number; // Sistemas, ERP, Domínio e Contabilidade (R$/mês)
  otherFixedCostsMonthly?: number;   // Outras despesas fixas (R$/mês)
  estimatedMonthlyRevenue?: number;  // Faturamento mensal estimado da loja (R$/mês)

  // Margem de Lucro (%)
  desiredProfitPct: number;         // Margem de Lucro Líquido Desejada (%)
}

export const defaultPricingRules: PricingRulesConfig = {
  defaultPackagingCost: 2.00,
  defaultShippingInCost: 0.00,
  taxRatePct: 6,
  gatewayFeePct: 4,
  commissionPct: 0,
  pixFeeRatePct: 0.99,
  fixedCostPct: 10,
  useCalculatedFixedCost: true,
  rentCostMonthly: 1200,
  utilitiesCostMonthly: 400,
  salariesCostMonthly: 3000,
  marketingCostMonthly: 500,
  softwareAccountingCostMonthly: 300,
  otherFixedCostsMonthly: 100,
  estimatedMonthlyRevenue: 50000,
  desiredProfitPct: 20,
};

export interface PricingCalculationResult {
  baseCost: number;             // Matéria-prima / Preço de compra do fornecedor
  packagingCost: number;        // Embalagens e Etiquetas
  shippingInCost: number;       // Frete de Entrada
  totalDirectCost: number;      // Custo Direto Total (R$)
  
  taxRatePct: number;           // Imposto NF %
  gatewayFeePct: number;        // Taxa Maquininha %
  commissionPct: number;        // Comissão %
  effectiveFixedCostPct: number;// Custo Fixo %
  desiredProfitPct: number;     // Margem %

  sumPct: number;               // Soma de todas as taxas/margens (%)
  divisor: number;              // 1 - (sumPct / 100)
  suggestedPrice: number;       // Preço de Venda Sugerido (R$)
  
  taxAmount: number;            // Imposto NF em R$
  gatewayFeeAmount: number;     // Taxa Maquininha em R$
  commissionAmount: number;     // Comissão em R$
  fixedCostAmount: number;      // Custo Fixo em R$
  profitAmount: number;         // Lucro Líquido Limpo em R$
  profitMarginRealPct: number;  // Margem de Lucro % Real
  
  // Resumo de Custos Fixos Estruturais
  totalMonthlyFixedExpenses?: number; // Soma do aluguel + luz/água/net + salários
}

export function calculateEffectiveFixedCostPct(cfg: PricingRulesConfig): number {
  if (cfg.estimatedMonthlyRevenue && cfg.estimatedMonthlyRevenue > 100) {
    const rent = cfg.rentCostMonthly || 0;
    const utilities = cfg.utilitiesCostMonthly || 0;
    const salaries = cfg.salariesCostMonthly || 0;
    const marketing = cfg.marketingCostMonthly || 0;
    const software = cfg.softwareAccountingCostMonthly || 0;
    const other = cfg.otherFixedCostsMonthly || 0;
    const totalFixed = rent + utilities + salaries + marketing + software + other;
    return Math.min(80, (totalFixed / cfg.estimatedMonthlyRevenue) * 100);
  }
  return 0;
}

export function calculateSuggestedPriceFromProfitVal(
  costPrice: number,
  rules?: Partial<PricingRulesConfig>,
  customPackaging?: number,
  profitVal: number = 0
): number {
  const cfg: PricingRulesConfig = { ...defaultPricingRules, ...rules };
  
  const baseCost = Math.max(0, Number(costPrice) || 0);
  const packagingCost = customPackaging !== undefined ? Math.max(0, Number(customPackaging) || 0) : (cfg.defaultPackagingCost || 0);
  const totalDirectCost = baseCost + packagingCost;

  const effectiveFixedCostPct = calculateEffectiveFixedCostPct(cfg);

  const taxRatePct = cfg.taxRatePct || 0;
  const gatewayFeePct = cfg.gatewayFeePct || 0;
  const commissionPct = cfg.commissionPct || 0;

  const sumPct = Math.min(99, Math.max(0, taxRatePct + gatewayFeePct + commissionPct + effectiveFixedCostPct));
  const divisor = Math.max(0.01, 1 - (sumPct / 100));

  return (totalDirectCost + profitVal) / divisor;
}

export function calculateSuggestedPrice(
  costPrice: number,
  rules?: Partial<PricingRulesConfig>,
  customPackaging?: number,
  customShippingIn?: number,
  customDesiredProfit?: number
): PricingCalculationResult {
  const cfg: PricingRulesConfig = { ...defaultPricingRules, ...rules };
  if (customDesiredProfit !== undefined) {
    cfg.desiredProfitPct = customDesiredProfit;
  }
  
  const baseCost = Math.max(0, Number(costPrice) || 0);
  const packagingCost = customPackaging !== undefined ? Math.max(0, Number(customPackaging) || 0) : (cfg.defaultPackagingCost || 0);
  const shippingInCost = customShippingIn !== undefined ? Math.max(0, Number(customShippingIn) || 0) : (cfg.defaultShippingInCost || 0);
  
  const totalDirectCost = baseCost + packagingCost + shippingInCost;

  const effectiveFixedCostPct = calculateEffectiveFixedCostPct(cfg);

  const taxRatePct = cfg.taxRatePct || 0;
  const gatewayFeePct = cfg.gatewayFeePct || 0;
  const commissionPct = cfg.commissionPct || 0;
  const desiredProfitPct = cfg.desiredProfitPct || 0;

  const sumPct = Math.min(99, Math.max(0, taxRatePct + gatewayFeePct + commissionPct + effectiveFixedCostPct + desiredProfitPct));
  const divisor = Math.max(0.01, 1 - (sumPct / 100));

  const suggestedPrice = totalDirectCost > 0 ? totalDirectCost / divisor : 0;

  const taxAmount = suggestedPrice * (taxRatePct / 100);
  const gatewayFeeAmount = suggestedPrice * (gatewayFeePct / 100);
  const commissionAmount = suggestedPrice * (commissionPct / 100);
  const fixedCostAmount = suggestedPrice * (effectiveFixedCostPct / 100);
  const profitAmount = suggestedPrice * (desiredProfitPct / 100);

  const profitMarginRealPct = suggestedPrice > 0 ? (profitAmount / suggestedPrice) * 100 : 0;

  const totalMonthlyFixedExpenses = (cfg.rentCostMonthly || 0) + (cfg.utilitiesCostMonthly || 0) + (cfg.salariesCostMonthly || 0) + (cfg.marketingCostMonthly || 0) + (cfg.softwareAccountingCostMonthly || 0) + (cfg.otherFixedCostsMonthly || 0);

  return {
    baseCost,
    packagingCost,
    shippingInCost,
    totalDirectCost,
    
    taxRatePct,
    gatewayFeePct,
    commissionPct,
    effectiveFixedCostPct,
    desiredProfitPct,

    sumPct,
    divisor,
    suggestedPrice,
    
    taxAmount,
    gatewayFeeAmount,
    commissionAmount,
    fixedCostAmount,
    profitAmount,
    profitMarginRealPct,

    totalMonthlyFixedExpenses
  };
}

export interface ProductProfitabilityAnalysis {
  sellingPrice: number;
  baseCost: number;             // Custo do fornecedor/materia-prima
  packagingCost: number;        // Embalagem
  shippingInCost: number;       // Frete de entrada
  totalDirectCost: number;      // Custo Direto Total (R$)
  
  taxAmount: number;            // Impostos (R$)
  gatewayFeeAmount: number;     // Maquininha (R$)
  commissionAmount: number;     // Comissão (R$)
  fixedCostAmount: number;      // Custo Fixo Rateado (R$)
  
  pixFeeAmount: number;         // Taxa do PIX (R$)
  
  totalCost: number;            // CUSTO TOTAL ABSOLUTO (Direto + Impostos + Maquininha + Comissão + Custo Fixo)
  totalCostPix: number;         // Custo Total no PIX
  
  netProfit: number;            // LUCRO LÍQUIDO REAL (R$)
  marginPct: number;            // MARGEM DE LUCRO LÍQUIDA REAL (%)
  
  netProfitPix: number;         // LUCRO LÍQUIDO NO PIX (R$)
  marginPctPix: number;         // MARGEM DE LUCRO NO PIX (%)
  
  isProfitable: boolean;
}

export function calculateActualProductProfitability(
  sellingPrice: number,
  costPrice: number = 0,
  rules?: Partial<PricingRulesConfig>,
  customPackaging?: number,
  customShippingIn?: number,
  customDesiredProfit?: number
): ProductProfitabilityAnalysis {
  const cfg: PricingRulesConfig = { ...defaultPricingRules, ...rules };
  if (customDesiredProfit !== undefined) {
    cfg.desiredProfitPct = customDesiredProfit;
  }
  const sell = Math.max(0, Number(sellingPrice) || 0);
  const baseCost = Math.max(0, Number(costPrice) || 0);
  
  const packagingCost = customPackaging !== undefined ? Math.max(0, Number(customPackaging) || 0) : (cfg.defaultPackagingCost || 0);
  const shippingInCost = customShippingIn !== undefined ? Math.max(0, Number(customShippingIn) || 0) : (cfg.defaultShippingInCost || 0);
  
  const totalDirectCost = baseCost + packagingCost + shippingInCost;
  
  const effectiveFixedCostPct = calculateEffectiveFixedCostPct(cfg);
  
  const taxAmount = sell * ((cfg.taxRatePct || 0) / 100);
  const gatewayFeeAmount = sell * ((cfg.gatewayFeePct || 0) / 100);
  const commissionAmount = sell * ((cfg.commissionPct || 0) / 100);
  const fixedCostAmount = sell * (effectiveFixedCostPct / 100);
  
  const pixFeeRatePct = cfg.pixFeeRatePct !== undefined ? cfg.pixFeeRatePct : 0.99;
  const pixFeeAmount = sell * (pixFeeRatePct / 100);
  
  const totalCost = totalDirectCost + taxAmount + gatewayFeeAmount + commissionAmount + fixedCostAmount;
  const totalCostPix = totalDirectCost + taxAmount + pixFeeAmount + commissionAmount + fixedCostAmount;
  
  const netProfit = sell - totalCost;
  const marginPct = sell > 0 ? (netProfit / sell) * 100 : 0;
  
  const netProfitPix = sell - totalCostPix;
  const marginPctPix = sell > 0 ? (netProfitPix / sell) * 100 : 0;
  
  return {
    sellingPrice: sell,
    baseCost,
    packagingCost,
    shippingInCost,
    totalDirectCost,
    taxAmount,
    gatewayFeeAmount,
    commissionAmount,
    fixedCostAmount,
    pixFeeAmount,
    totalCost,
    totalCostPix,
    netProfit,
    marginPct,
    netProfitPix,
    marginPctPix,
    isProfitable: netProfit > 0
  };
}


