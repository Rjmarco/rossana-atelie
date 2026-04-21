import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Building2, 
  Phone, 
  MapPin, 
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  getDocs,
  query,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLaboratory } from '../context/LaboratoryContext';
import { Clinic, Dentist } from '../types';
import { cn } from '../lib/utils';

interface DentistModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDentist?: Dentist | null;
}

export default function DentistModal({ isOpen, onClose, editingDentist }: DentistModalProps) {
  const { labId } = useLaboratory();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [address, setAddress] = useState('');

  const [clinics, setClinics] = useState<Clinic[]>([]);

  useEffect(() => {
    if (isOpen && labId) {
      fetchClinics();
      if (editingDentist) {
        setName(editingDentist.name || '');
        setPhone(editingDentist.phone || '');
        setClinicId(editingDentist.clinicId || '');
        setClinicName(editingDentist.clinicName || '');
        setAddress(editingDentist.address || '');
      } else {
        setName('');
        setPhone('');
        setClinicId('');
        setClinicName('');
        setAddress('');
      }
    }
  }, [isOpen, labId, editingDentist]);

  const fetchClinics = async () => {
    if (!labId) return;

    const snap = await getDocs(query(collection(db, `laboratories/${labId}/clinics`)));
    setClinics(snap.docs.map(d => ({ id: d.id, ...d.data() } as Clinic)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labId || !name) return;
    setLoading(true);

    try {
      const selectedClinic = clinics.find(c => c.id === clinicId);
      const data = {
        labId,
        name,
        phone,
        clinicId: clinicId || null,
        clinicName: selectedClinic ? selectedClinic.name : (clinicName || 'Independente'),
        address: address || selectedClinic?.address || '',
      };

      if (editingDentist) {
        await updateDoc(doc(db, `laboratories/${labId}/dentists`, editingDentist.id), data);
      } else {
        await addDoc(collection(db, `laboratories/${labId}/dentists`), data);
      }

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
        className="bg-white w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-[2rem] md:rounded-[3rem] shadow-2xl relative z-10"
      >
        <div className="bg-brand-deep p-8 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif">Novo <span className="italic font-semibold">Parceiro</span></h2>
            <p className="text-white/50 text-[10px] uppercase font-black tracking-widest mt-1">Cadastro de Profissional</p>
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
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 rounded-2xl border border-transparent focus:bg-white focus:border-brand-accent/20 outline-none transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 rounded-2xl border border-transparent focus:bg-white focus:border-brand-accent/20 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Vincular Clínica</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                <select 
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 rounded-2xl border border-transparent focus:bg-white focus:border-brand-accent/20 outline-none transition-all text-sm font-medium appearance-none"
                >
                  <option value="">Nenhuma (Independente)</option>
                  {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Endereço de Coleta/Entrega</label>
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

          {error && <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest">{error}</p>}

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
