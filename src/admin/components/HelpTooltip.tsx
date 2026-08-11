import React, { useState } from 'react';
import { HelpCircle, X, Info } from 'lucide-react';

interface HelpTooltipProps {
  title: string;
  description: string;
  example?: string;
  className?: string;
}

export function HelpTooltip({ title, description, example, className = '' }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`inline-flex items-center relative ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-full transition-colors cursor-pointer focus:outline-none"
        title="Clique para ver o significado simples"
      >
        <HelpCircle size={15} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for click outside on mobile */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-slate-900 text-white text-xs p-3.5 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 border border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-blue-400 flex items-center gap-1.5">
                <Info size={13} /> {title}
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-slate-200 leading-relaxed font-normal">{description}</p>
            {example && (
              <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400 italic">
                <strong className="text-slate-300 not-italic font-semibold">Exemplo:</strong> {example}
              </div>
            )}
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-slate-700" />
          </div>
        </>
      )}
    </div>
  );
}
