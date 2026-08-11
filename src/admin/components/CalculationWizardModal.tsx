import React, { useState } from 'react';
import { X, Calculator, ArrowRight, ArrowLeft, Check, Sparkles, Copy, ShoppingBag, Ruler, Image as ImageIcon, Layers } from 'lucide-react';
import { formatPrice } from '../../data/products';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface CalculationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (item: any) => void;
}

interface MediaOption {
  id: string;
  name: string;
  category: 'lona' | 'papel' | 'vinil' | 'rigido' | 'brinde';
  pricePerM2: number;
  image: string;
  description: string;
  unit?: string;
}

const MEDIA_OPTIONS: MediaOption[] = [
  {
    id: 'lona-440g',
    name: 'Lona Frontlight 440g BR',
    category: 'lona',
    pricePerM2: 65.00,
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=600&auto=format&fit=crop',
    description: 'Ideal para faixas, banners de grandes formatos e painéis externos resistentes ao sol e chuva.'
  },
  {
    id: 'vinil-adesivo-brilho',
    name: 'Vinil Adesivo Polimérico Brilho',
    category: 'vinil',
    pricePerM2: 75.00,
    image: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?q=80&w=600&auto=format&fit=crop',
    description: 'Adesivo de alta durabilidade para vitrines, placas, veículos e comunicação visual.'
  },
  {
    id: 'vinil-adesivo-fosco',
    name: 'Vinil Adesivo Fosco Anti-Reflexo',
    category: 'vinil',
    pricePerM2: 80.00,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
    description: 'Excelente para interiores, decoração, paredes e fotografias sem reflexos de luz.'
  },
  {
    id: 'papel-couche-250g',
    name: 'Papel Couchê 250g / 300g (Offset/Digital)',
    category: 'papel',
    pricePerM2: 95.00,
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=600&auto=format&fit=crop',
    description: 'Papel premium de alta gramatura para cartazes, panfletos luxo e postais.'
  },
  {
    id: 'placa-ps-2mm',
    name: 'Placa PS (Poliestireno) 2mm + Impressão',
    category: 'rigido',
    pricePerM2: 120.00,
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600&auto=format&fit=crop',
    description: 'Chapa rígida leve e resistente para sinalização, quadros e placas de identificação.'
  },
  {
    id: 'acrilico-3mm',
    name: 'Acrílico Cristal 3mm + Impressão UV Direct',
    category: 'rigido',
    pricePerM2: 320.00,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop',
    description: 'Acabamento super sofisticado com transparência e impressão direta UV de altíssima definição.'
  },
  {
    id: 'banner-rollup',
    name: 'Banner Roll-Up Alumínio Repetível',
    category: 'lona',
    pricePerM2: 180.00,
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop',
    description: 'Estrutura retrátil portátil completa com lona impressa e bolsa de transporte.'
  },
  {
    id: 'caneca-porcelana',
    name: 'Brinde: Caneca Porcelana Resinada 325ml',
    category: 'brinde',
    pricePerM2: 35.00, // Unit price override
    unit: 'unidade',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop',
    description: 'Caneca cilíndrica de porcelana para sublimação total sem limites de cores.'
  }
];

const FINISHES = [
  { id: 'ilhos-4', name: 'Ilhós nos 4 cantos', price: 10.00, type: 'fixed' },
  { id: 'ilhos-50cm', name: 'Ilhós a cada 50cm no perímetro', price: 15.00, type: 'fixed' },
  { id: 'refile', name: 'Refile reto preciso', price: 0.00, type: 'free' },
  { id: 'bastao-cordao', name: 'Bastão de madeira, ponteiras e cordão', price: 18.00, type: 'fixed' },
  { id: 'verniz-uv', name: 'Verniz UV Total / Laminação Brilho', price: 25.00, type: 'm2' },
  { id: 'laminacao-fosca', name: 'Laminação Fosca Soft Touch', price: 30.00, type: 'm2' },
  { id: 'fita-dupla-face', name: 'Fita Dupla Face 3M no verso', price: 12.00, type: 'fixed' },
];

export function CalculationWizardModal({ isOpen, onClose, onAddToCart }: CalculationWizardModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Step 1 State
  const [selectedMedia, setSelectedMedia] = useState<MediaOption>(MEDIA_OPTIONS[0]);

  // Step 2 State
  const [widthCm, setWidthCm] = useState<number>(100);
  const [heightCm, setHeightCm] = useState<number>(100);
  const [quantity, setQuantity] = useState<number>(1);
  const [customPriceOverride, setCustomPriceOverride] = useState<number | null>(null);

  // Step 3 State
  const [selectedFinishes, setSelectedFinishes] = useState<string[]>(['refile']);

  if (!isOpen) return null;

  const isUnitItem = selectedMedia.unit === 'unidade';
  
  // Calculations
  const widthM = widthCm / 100;
  const heightM = heightCm / 100;
  const areaM2 = Math.max(0.01, widthM * heightM);

  const basePricePerItem = isUnitItem 
    ? selectedMedia.pricePerM2 
    : (customPriceOverride ?? selectedMedia.pricePerM2) * areaM2;

  const finishesTotalCost = selectedFinishes.reduce((acc, finishId) => {
    const f = FINISHES.find(item => item.id === finishId);
    if (!f) return acc;
    if (f.type === 'm2') return acc + (f.price * areaM2);
    return acc + f.price;
  }, 0);

  const unitPriceFinal = basePricePerItem + finishesTotalCost;
  const grandTotal = unitPriceFinal * quantity;

  const toggleFinish = (finishId: string) => {
    if (selectedFinishes.includes(finishId)) {
      setSelectedFinishes(selectedFinishes.filter(id => id !== finishId));
    } else {
      setSelectedFinishes([...selectedFinishes, finishId]);
    }
  };

  const handleFinishAndSendToPos = () => {
    const itemData = {
      id: `wiz-${Date.now()}`,
      name: `${selectedMedia.name} (${widthCm}x${heightCm}cm)`,
      price: unitPriceFinal,
      quantity,
      image: selectedMedia.image,
      details: {
        widthCm,
        heightCm,
        areaM2: areaM2.toFixed(2),
        finishes: selectedFinishes.map(id => FINISHES.find(f => f.id === id)?.name).filter(Boolean)
      },
      isCustom: true
    };

    if (onAddToCart) {
      onAddToCart(itemData);
      toast.success("Item calculado adicionado ao carrinho!");
      onClose();
    } else {
      navigate('/admin/pos', { state: { editOrder: null, addCustomItem: itemData } });
      toast.success("Calculado! Redirecionando para o PDV...");
      onClose();
    }
  };

  const copySummaryText = () => {
    const finishesNames = selectedFinishes
      .map(id => FINISHES.find(f => f.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'Nenhum';

    const text = `*ORÇAMENTO DE IMPRESSÃO / MÍDIA*\n\n` +
      `📌 *Produto/Mídia:* ${selectedMedia.name}\n` +
      `📏 *Dimensões:* ${widthCm} cm (Largura) x ${heightCm} cm (Altura) [${areaM2.toFixed(2)} m²]\n` +
      `✨ *Acabamento:* ${finishesNames}\n` +
      `🔢 *Quantidade:* ${quantity} un.\n` +
      `💰 *Valor Unitário:* ${formatPrice(unitPriceFinal)}\n` +
      `🏷️ *TOTAL:* ${formatPrice(grandTotal)}\n\n` +
      `Qualquer dúvida, estamos à disposição!`;

    navigator.clipboard.writeText(text);
    toast.success("Resumo do orçamento copiado para a área de transferência!");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Calculator size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight uppercase flex items-center gap-2 text-white">
                Calculadora Interativa de m² & Impressos
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Passo a passo visual em 3 etapas • Zero curva de aprendizado
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Step Progress Indicator Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 w-full max-w-2xl mx-auto">
            
            {/* Step 1 */}
            <button 
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 text-xs font-bold transition-all ${
                step === 1 ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                step === 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'
              }`}>
                1
              </span>
              <span className="hidden sm:inline uppercase tracking-wider">1. Qual Mídia/Produto?</span>
            </button>

            <div className="flex-1 h-0.5 bg-slate-200 rounded-full" />

            {/* Step 2 */}
            <button 
              onClick={() => setStep(2)}
              className={`flex items-center gap-2 text-xs font-bold transition-all ${
                step === 2 ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                step === 2 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'
              }`}>
                2
              </span>
              <span className="hidden sm:inline uppercase tracking-wider">2. Dimensões Largura x Altura</span>
            </button>

            <div className="flex-1 h-0.5 bg-slate-200 rounded-full" />

            {/* Step 3 */}
            <button 
              onClick={() => setStep(3)}
              className={`flex items-center gap-2 text-xs font-bold transition-all ${
                step === 3 ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                step === 3 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'
              }`}>
                3
              </span>
              <span className="hidden sm:inline uppercase tracking-wider">3. Acabamentos & Resumo</span>
            </button>

          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 bg-slate-50/50">

          {/* STEP 1: SELECT MEDIA */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center max-w-lg mx-auto">
                <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                  Etapa 1: Selecione a Mídia ou Material
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Escolha o tipo de papel, lona, vinil ou rígido com o qual você vai trabalhar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {MEDIA_OPTIONS.map((media) => {
                  const isSelected = selectedMedia.id === media.id;
                  return (
                    <div
                      key={media.id}
                      onClick={() => setSelectedMedia(media)}
                      className={`bg-white rounded-2xl border-2 p-3.5 transition-all cursor-pointer flex flex-col justify-between group hover:shadow-lg relative ${
                        isSelected 
                          ? 'border-blue-600 ring-4 ring-blue-500/10 shadow-md' 
                          : 'border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-3 right-3 bg-blue-600 text-white p-1 rounded-full shadow-md z-10">
                          <Check size={14} />
                        </span>
                      )}

                      <div className="space-y-3">
                        <div className="h-28 rounded-xl overflow-hidden bg-slate-100 relative">
                          <img 
                            src={media.image} 
                            alt={media.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {media.category}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                            {media.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {media.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Preço Padrão</span>
                        <span className="font-black text-sm text-blue-600">
                          {formatPrice(media.pricePerM2)} {media.unit === 'unidade' ? '/ un' : '/ m²'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: DIMENSIONS & SCALED PREVIEW */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center max-w-lg mx-auto">
                <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                  Etapa 2: Informe as Dimensões (Largura x Altura)
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Mídia selecionada: <strong className="text-blue-600">{selectedMedia.name}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm">
                
                {/* Inputs Column */}
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5 flex items-center gap-1">
                        <Ruler size={14} className="text-blue-600" /> Largura (cm)
                      </label>
                      <input 
                        type="number"
                        min="1"
                        value={widthCm || ''}
                        onChange={(e) => setWidthCm(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-lg font-black text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-all"
                        placeholder="Ex: 100"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5 flex items-center gap-1">
                        <Ruler size={14} className="text-blue-600" /> Altura (cm)
                      </label>
                      <input 
                        type="number"
                        min="1"
                        value={heightCm || ''}
                        onChange={(e) => setHeightCm(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-lg font-black text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-all"
                        placeholder="Ex: 100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                        Quantidade (unidades)
                      </label>
                      <input 
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-base font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                        Ajustar R$ / m²
                      </label>
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={customPriceOverride ?? selectedMedia.pricePerM2}
                        onChange={(e) => setCustomPriceOverride(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-base font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Calculated metrics badge */}
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                        Área Calculada
                      </span>
                      <strong className="text-xl font-black text-emerald-950">
                        {areaM2.toFixed(2)} m²
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                        Preço Base da Mídia
                      </span>
                      <strong className="text-xl font-black text-emerald-800">
                        {formatPrice(basePricePerItem)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Scaled Visual Box Column */}
                <div className="flex flex-col items-center justify-center bg-slate-100/70 border border-slate-200 rounded-2xl p-6 min-h-[220px] relative overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Visualização em Escala Proporcional
                  </span>

                  {/* Scaled Box */}
                  <div 
                    className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl border-2 border-white shadow-xl flex flex-col items-center justify-center p-3 text-white transition-all duration-300 max-w-[240px] max-h-[160px]"
                    style={{
                      aspectRatio: `${widthCm} / ${heightCm}`,
                      width: widthCm >= heightCm ? '180px' : `${Math.max(60, (widthCm / heightCm) * 140)}px`,
                      height: heightCm > widthCm ? '140px' : `${Math.max(60, (heightCm / widthCm) * 140)}px`,
                    }}
                  >
                    <span className="font-extrabold text-xs drop-shadow-sm text-center">
                      {widthCm} x {heightCm} cm
                    </span>
                    <span className="text-[10px] opacity-80 font-medium">
                      {areaM2.toFixed(2)} m²
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium mt-4 text-center">
                    {widthM.toFixed(2)} m (Largura) × {heightM.toFixed(2)} m (Altura)
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: FINISHES & SUMMARY */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center max-w-lg mx-auto">
                <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                  Etapa 3: Escolha os Acabamentos & Revise o Orçamento
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Adicione acabamentos extras para um resultado impecável.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Finishes Selection List */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Layers size={16} className="text-blue-600" /> Opções de Acabamento
                  </h4>

                  <div className="space-y-2.5">
                    {FINISHES.map((finish) => {
                      const isChecked = selectedFinishes.includes(finish.id);
                      return (
                        <div
                          key={finish.id}
                          onClick={() => toggleFinish(finish.id)}
                          className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? 'border-blue-600 bg-blue-50/50 text-slate-900 font-bold'
                              : 'border-slate-100 hover:border-slate-200 bg-slate-50/50 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                              isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isChecked && <Check size={12} />}
                            </div>
                            <span className="text-xs">{finish.name}</span>
                          </div>

                          <span className="text-xs font-extrabold text-blue-700">
                            {finish.price === 0 ? 'Incluso' : `+ ${formatPrice(finish.price)} ${finish.type === 'm2' ? '/m²' : ''}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-5 flex flex-col justify-between shadow-xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs uppercase font-extrabold text-blue-400 tracking-wider">
                        Resumo do Cálculo
                      </span>
                      <span className="bg-blue-500/20 text-blue-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-500/30 uppercase">
                        {quantity}x
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Mídia ({selectedMedia.name}):</span>
                        <strong className="text-white">{formatPrice(basePricePerItem)}</strong>
                      </div>

                      <div className="flex justify-between text-slate-300">
                        <span>Dimensões:</span>
                        <strong className="text-white">{widthCm}x{heightCm}cm ({areaM2.toFixed(2)}m²)</strong>
                      </div>

                      <div className="flex justify-between text-slate-300">
                        <span>Acabamentos ({selectedFinishes.length}):</span>
                        <strong className="text-white">{formatPrice(finishesTotalCost)}</strong>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-300">
                        <span>Preço Unitário:</span>
                        <strong className="text-emerald-400 font-extrabold">{formatPrice(unitPriceFinal)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        VALOR TOTAL CALCULADO
                      </span>
                      <strong className="text-3xl font-black text-emerald-400 tracking-tight">
                        {formatPrice(grandTotal)}
                      </strong>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={handleFinishAndSendToPos}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={16} /> Lançar no PDV / Carrinho
                      </button>

                      <button
                        onClick={copySummaryText}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Copy size={14} /> Copiar para WhatsApp
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        <div className="bg-white border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as any)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as any)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              Avançar <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinishAndSendToPos}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              Concluir Cálculo <Check size={16} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
