import React, { useMemo } from 'react';
import { X, Printer, Download, FileText, CheckCircle2, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, Transaction } from '../types';

interface MonthlyReportProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  transactions: Transaction[];
  dentists: Record<string, string>;
}

export default function MonthlyReport({ isOpen, onClose, orders, transactions, dentists }: MonthlyReportProps) {
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'finished').length;
    const revenue = orders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const expenses = transactions.filter(t => t.type === 'out').reduce((acc, curr) => acc + (curr.value || 0), 0);
    const profit = revenue - expenses;

    // Group by dentist
    const dentistSummaryRecord: Record<string, { count: number; total: number; name: string }> = {};
    orders.forEach(o => {
      if (!dentistSummaryRecord[o.dentistId]) {
        dentistSummaryRecord[o.dentistId] = { count: 0, total: 0, name: dentists[o.dentistId] || 'Especialista' };
      }
      dentistSummaryRecord[o.dentistId].count++;
      dentistSummaryRecord[o.dentistId].total += o.total || 0;
    });

    const dentistSummary = Object.values(dentistSummaryRecord);

    return { totalOrders, completedOrders, revenue, expenses, profit, dentistSummary };
  }, [orders, transactions, dentists]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-deep/90 backdrop-blur-md no-print"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] shadow-2xl relative z-10 flex flex-col print:max-h-none print:shadow-none print:rounded-none"
      >
        <div className="bg-brand-deep p-10 text-white flex items-center justify-between no-print sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent rounded-2xl">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-serif">Relatório de <span className="italic font-semibold">Desempenho</span></h2>
              <p className="text-white/50 text-[10px] uppercase font-black tracking-widest mt-1">Fechamento do Período</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={() => window.print()}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"
            >
              <Printer size={20} />
            </button>
            <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-12 space-y-12">
          {/* Print Header */}
          <div className="hidden print:block text-center border-b border-neutral-100 pb-10 mb-10">
            <h1 className="text-4xl font-serif font-light tracking-[0.3em] uppercase text-brand-deep">Rossana</h1>
            <p className="text-[12px] font-sans font-black tracking-[0.4em] text-brand-salmon uppercase -mt-1">Freitas Atelier Laboratorial</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-6">Relatório de Atividades • {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
          </div>

          {/* Core Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-8 bg-brand-beige/20 rounded-[2.5rem] border border-brand-beige">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Requisições</p>
              <p className="text-3xl font-serif font-bold text-brand-deep mt-2">{stats.totalOrders}</p>
            </div>
            <div className="p-8 bg-brand-beige/20 rounded-[2.5rem] border border-brand-beige">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Honorários Brutos</p>
              <p className="text-3xl font-serif font-bold text-brand-deep mt-2">R$ {stats.revenue.toFixed(2)}</p>
            </div>
            <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Insumos/Saídas</p>
              <p className="text-3xl font-serif font-bold text-rose-600 mt-2">R$ {stats.expenses.toFixed(2)}</p>
            </div>
            <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Saldo Atelier</p>
              <p className="text-3xl font-serif font-bold text-emerald-600 mt-2">R$ {stats.profit.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             {/* Dentist Breakdown */}
            <div className="space-y-6">
              <h3 className="font-serif text-2xl text-brand-deep border-b border-brand-beige pb-4">Produção por <span className="italic">Especialista</span></h3>
              <div className="space-y-4">
                {stats.dentistSummary.sort((a,b) => b.total - a.total).map((d) => (
                  <div key={d.name} className="flex items-center justify-between p-6 bg-white border border-[#F5F2EF] rounded-3xl hover:shadow-xl hover:shadow-brand-accent/5 transition-all group">
                    <div>
                      <p className="text-sm font-bold text-brand-deep group-hover:text-brand-accent transition-colors">{d.name}</p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">{d.count} Trabalhos</p>
                    </div>
                    <p className="text-lg font-serif font-bold text-brand-deep">R$ {d.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-6">
              <h3 className="font-serif text-2xl text-brand-deep border-b border-brand-beige pb-4">Status do <span className="italic">Atelier</span></h3>
              <div className="bg-neutral-50 p-10 rounded-[3rem] space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-neutral-400">
                    <span>Taxa de Entrega</span>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.completedOrders / (stats.totalOrders || 1)) * 100}%` }}
                      className="h-full bg-brand-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Finalizados</p>
                    <p className="text-2xl font-serif font-bold text-brand-deep">{stats.completedOrders}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Em Aberto</p>
                    <p className="text-2xl font-serif font-bold text-brand-salmon">{stats.totalOrders - stats.completedOrders}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Print Footer */}
          <div className="hidden print:block mt-20 pt-10 border-t border-neutral-100 flex justify-between items-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Rossana Freitas Atelier • Auditoria Gerencial</p>
            <p className="text-[9px] text-neutral-300 font-bold uppercase">{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
