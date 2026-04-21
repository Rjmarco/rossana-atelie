import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Phone, 
  MapPin, 
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  doc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLaboratory } from '../context/LaboratoryContext';
import { Clinic } from '../types';

interface ClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingClinic?: Clinic | null;
}

export default function ClinicModal({ isOpen, onClose, onSuccess, editingClinic }: ClinicModalProps) {
  const { labId } = useLaboratory();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (editingClinic) {
        setName(editingClinic.name || '');
        setPhone(editingClinic.phone || '');
        setAddress(editingClinic.address || '');
      } else {
        setName('');
        setPhone('');
        setAddress('');
      }
    }
  }, [isOpen, editingClinic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labId || !name) {
      setError('Por favor, informe o nome da clínica.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const data = {
        name,
        phone,
        address,
        labId,
        updatedAt: serverTimestamp(),
      };

      if (editingClinic) {
        await updateDoc(doc(db, `laboratories/${labId}/clinics`, editingClinic.id), data);
      } else {
        await addDoc(collection(db, `laboratories/${labId}/clinics`), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving clinic:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-deep/80 backdrop-blur-sm"
        />
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] md:rounded-[3rem] shadow-2xl relative z-10"
      >
        <div className="bg-brand-deep p-8 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif">Nova <span className="italic font-semibold">Clínica</span></h2>
            <p className="text-white/50 text-[10px] uppercase font-black tracking-widest mt-1">Gestão de Unidades de Atendimento</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6">
          {error && (
             <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase tracking-widest">
               {error}
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Nome Fantasia</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Sorriso Prime"
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 rounded-2xl border border-transparent focus:bg-white focus:border-brand-accent/20 outline-none transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Telefone Principal</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 rounded-2xl border border-transparent focus:bg-white focus:border-brand-accent/20 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Endereço Completo</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, complemento - Cidade/UF"
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 rounded-2xl border border-transparent focus:bg-white focus:border-brand-accent/20 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-deep text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-brand-accent hover:shadow-xl hover:shadow-brand-accent/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
