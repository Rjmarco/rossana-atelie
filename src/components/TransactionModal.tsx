import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLaboratory } from '../context/LaboratoryContext';
import { cn } from '../lib/utils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const { labId } = useLaboratory();
  const [type, setType] = useState<'in' | 'out'>('in');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!labId || !description || !value) return;
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, `laboratories/${labId}/transactions`), {
        description,
        value: parseFloat(value),
        type,
        category,
        createdAt: serverTimestamp(),
      });
      onClose();
      setDescription('');
      setValue('');
      setCategory('');
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-deep/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg max-h-[95vh] overflow-y-auto rounded-[2rem] md:rounded-[3rem] shadow-2xl relative z-10"
      >
        <div className="bg-brand-deep p-8 text-white flex items-center justify-between">
          <h2 className="text-2xl font-serif">Novo <span className="italic font-semibold">Lançamento</span></h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-10 space-y-8">
          {error && (
             <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase tracking-widest">
               {error}
             </div>
          )}
          <div className="flex bg-neutral-100 p-1.5 rounded-full border border-neutral-100">
            <button 
              onClick={() => setType('in')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-full transition-all",
                type === 'in' ? "bg-white shadow-xl text-emerald-600" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              <ArrowUpRight size={14} />
              Receita
            </button>
            <button 
              onClick={() => setType('out')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-full transition-all",
                type === 'out' ? "bg-white shadow-xl text-rose-600" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              <ArrowDownLeft size={14} />
              Despesa
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Descrição</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Pagamento Fornecedor Ivoclar"
                className="w-full px-5 py-4 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-accent/20 outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                <input 
                  type="number" 
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-5 py-4 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-accent/20 outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Categoria</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-5 py-4 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-accent/20 outline-none transition-all text-sm font-medium appearance-none"
                >
                  <option value="">Geral</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Insumos">Insumos</option>
                  <option value="Aluguel">Aluguel</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Pro-labore">Pro-labore</option>
                </select>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading || !description || !value}
            className="w-full py-4 bg-brand-deep text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-brand-accent hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? 'Processando...' : <Check size={18} />}
            {loading ? '' : 'Confirmar Lançamento'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
