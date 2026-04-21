import React, { useState } from 'react';
import { X, Printer, Download, Mail, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, Service, Dentist } from '../types';
import { cn } from '../lib/utils';
import Logo from './Logo';

interface OrderReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  dentistName?: string;
}

export default function OrderReceipt({ isOpen, onClose, order, dentistName }: OrderReceiptProps) {
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>(order.teeth || []);
  const [showConfig, setShowConfig] = useState(true);

  if (!isOpen) return null;

  const handlePrint = () => {
    setShowConfig(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const unitPrice = order.teeth && order.teeth.length > 0 
    ? (order.total / order.teeth.length) 
    : order.total;

  const currentTotal = selectedTeeth.length > 0 
    ? unitPrice * selectedTeeth.length 
    : order.total;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-deep/80 backdrop-blur-md no-print"
        />
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] print:max-h-full print:shadow-none print:rounded-none"
      >
        {/* Actions Header */}
        <div className="bg-brand-deep p-6 text-white flex items-center justify-between no-print overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setShowConfig(!showConfig)}
               className={cn(
                 "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                 showConfig ? "bg-brand-salmon text-white" : "bg-white/10 text-white"
               )}
             >
               {showConfig ? 'Visualizar Nota' : 'Configurar Dentes'}
             </button>
             <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest hover:bg-brand-accent transition-all">
               <Printer size={16} />
               Gerar Nota
             </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row print:block">
          {/* Tooth Selector Section (Config) */}
          <AnimatePresence>
            {showConfig && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '320px', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-neutral-50 p-8 border-r border-neutral-100 no-print overflow-y-auto hidden md:block"
              >
                <div className="space-y-6">
                  <header>
                    <h3 className="text-[10px] font-black text-brand-salmon uppercase tracking-[0.2em] mb-2">Faturamento Detalhado</h3>
                    <p className="text-lg font-serif text-brand-deep leading-tight italic">Selecione os dentes para <span className="not-italic font-bold">emissão da nota</span></p>
                  </header>

                  <div className="space-y-2">
                    <button 
                      onClick={() => setSelectedTeeth(order.teeth || [])}
                      className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-brand-deep border border-neutral-200 rounded-lg hover:bg-white transition-all"
                    >
                      Selecionar Todos
                    </button>
                    <div className="grid grid-cols-4 gap-2">
                      {order.teeth?.map(t => (
                        <button 
                          key={t}
                          onClick={() => {
                            if (selectedTeeth.includes(t)) {
                              setSelectedTeeth(selectedTeeth.filter(x => x !== t));
                            } else {
                              setSelectedTeeth([...selectedTeeth, t]);
                            }
                          }}
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all border",
                            selectedTeeth.includes(t) 
                              ? "bg-brand-accent text-white border-brand-accent shadow-md scale-110" 
                              : "bg-white text-neutral-300 border-neutral-200"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-brand-deep rounded-[2rem] text-white">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Total Parcial da Nota</p>
                    <p className="text-2xl font-serif font-bold">R$ {currentTotal.toFixed(2)}</p>
                    <p className="text-[8px] mt-4 opacity-70 italic">* Baseado no valor unitário de R$ {unitPrice.toFixed(2)} por dente.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actual Receipt Page */}
          <div className="flex-1 bg-white p-8 md:p-14 text-brand-deep print:p-0 print:m-0" id="receipt-content">
            <div className="flex flex-col items-center text-center mb-16">
              <Logo className="h-32 mb-6" />
              <div className="w-16 h-0.5 bg-brand-accent mx-auto mt-8" />
              <p className="mt-10 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300">Nota de Serviço Laboratorial • n. {order.orderNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-16 mb-16 border-y border-neutral-100 py-12">
              <div className="space-y-6">
                <div>
                  <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-2">Destinatário</p>
                  <p className="text-base font-bold italic font-serif text-brand-deep">{dentistName || 'Dr(a). Especialista'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-2">Paciente</p>
                  <p className="text-sm font-bold uppercase tracking-tight">{order.patientName}</p>
                </div>
              </div>
              <div className="space-y-6 text-right">
                <div>
                  <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-2">Emissão</p>
                  <p className="text-sm font-bold tracking-tight">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-2">OS Original</p>
                  <p className="text-sm font-bold tracking-tight">#{order.orderNumber}</p>
                </div>
              </div>
            </div>

            <div className="space-y-12 mb-20">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-salmon">Descritivo dos Trabalhos</h3>
                <span className="text-[9px] font-bold text-neutral-400 italic">Preço Unitário: R$ {unitPrice.toFixed(2)}</span>
              </div>
              
              <div className="space-y-6">
                 {selectedTeeth.length > 0 ? (
                   <div className="grid grid-cols-1 gap-4">
                     <div className="flex items-center justify-between p-4 bg-brand-beige/20 rounded-2xl">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-salmon shadow-sm border border-brand-salmon/10">
                            <CheckCircle2 size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-brand-deep">{order.shadeScale || 'Trabalho de Prótese'}</p>
                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1">Dentes Selecionados: {selectedTeeth.sort().join(', ')}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-bold text-neutral-400 uppercase tracking-tight">{selectedTeeth.length} Unid.</p>
                          <p className="text-sm font-black text-brand-deep">R$ {currentTotal.toFixed(2)}</p>
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="py-10 text-center border-2 border-dashed border-neutral-100 rounded-[2rem]">
                      <p className="text-xs font-serif italic text-neutral-300">Nenhum item selecionado para esta nota.</p>
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-10">
                <div className="bg-neutral-50 p-8 rounded-[2rem] border border-neutral-100 shadow-inner">
                  <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-4">Especificações</p>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[10px] font-bold text-neutral-400">Escala de Cor:</span>
                      <span className="text-[10px] font-black text-brand-accent uppercase">{order.shadeScale || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] font-bold text-neutral-400">Tonalidade:</span>
                      <span className="text-[10px] font-black text-brand-accent uppercase">{Array.isArray(order.shade) ? order.shade.join(', ') : order.shade}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-end text-right">
                   <p className="text-[9px] font-black text-brand-salmon uppercase tracking-[0.2em] mb-2">Total à Pagar</p>
                   <p className="text-4xl font-serif font-black text-brand-deep italic">R$ {currentTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mt-24 grid grid-cols-2 gap-20">
               <div className="flex flex-col items-center">
                  <div className="w-full border-t border-neutral-200 mb-4" />
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Assinatura do Responsável</p>
               </div>
               <div className="flex flex-col items-center">
                  <div className="w-full border-t border-neutral-200 mb-4" />
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Recebido em ____/____/____</p>
               </div>
            </div>

            <footer className="mt-24 text-center">
              <p className="text-[8px] font-black text-neutral-200 uppercase tracking-[0.5em] leading-loose">Rossana Freitas Atelier • Excelência em Prótese Dental • 2026</p>
            </footer>
          </div>
        </div>
      </motion.div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .fixed { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: auto !important; background: white !important; }
          .shadow-2xl { box-shadow: none !important; }
          .rounded-[3rem] { border-radius: 0 !important; }
          .max-h-[90vh] { max-height: none !important; }
          .overflow-y-auto { overflow: visible !important; }
          #receipt-content { width: 100% !important; padding: 2cm !important; }
        }
      `}</style>
    </div>
  );
}
