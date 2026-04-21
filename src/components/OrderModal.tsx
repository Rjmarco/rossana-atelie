import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Calendar, 
  User, 
  Building2, 
  Stethoscope, 
  Clock, 
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useLaboratory } from '../context/LaboratoryContext';
import { Order, Dentist, Clinic, Service } from '../types';
import { cn } from '../lib/utils';
import ToothSelector from './ToothSelector';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingOrder?: Order | null;
}

const SHADE_SCALES = ['VITA Classical', 'VITA 3D-Master', 'Ivoclar Chromascop', 'Bleach Guide', 'Personalizada'];
const SHADES = ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4', 'BL1', 'BL2', 'BL3', 'BL4'];

export default function OrderModal({ isOpen, onClose, onSuccess, editingOrder }: OrderModalProps) {
  const { labId } = useLaboratory();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data State
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // Form State
  const [patientName, setPatientName] = useState('');
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [selectedDentistId, setSelectedDentistId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [shadeScale, setShadeScale] = useState('VITA Classical');
  const [shades, setShades] = useState<string[]>(['A2']);
  const [arch, setArch] = useState<'superior' | 'inferior' | 'both'>('superior');
  const [teeth, setTeeth] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [overridePrice, setOverridePrice] = useState<string>('');

  useEffect(() => {
    if (editingOrder) {
      setPatientName(editingOrder.patientName || '');
      setSelectedClinicId(editingOrder.clinicId || '');
      setSelectedDentistId(editingOrder.dentistId || '');
      setSelectedServiceId(editingOrder.serviceId || '');
      setShadeScale(editingOrder.shadeScale || 'VITA Classical');
      setShades(editingOrder.shade || ['A2']);
      setArch(editingOrder.arch || 'superior');
      setTeeth(editingOrder.teeth || []);
      setDueDate(editingOrder.dueDate || '');
      setNotes(editingOrder.notes || '');
      setOverridePrice(editingOrder.total?.toString() || '');
      setStep(1);
    } else {
      setPatientName('');
      setSelectedClinicId('');
      setSelectedDentistId('');
      setSelectedServiceId('');
      setShadeScale('VITA Classical');
      setShades(['A2']);
      setArch('superior');
      setTeeth([]);
      setDueDate('');
      setNotes('');
      setOverridePrice('');
      setStep(1);
    }
  }, [editingOrder, isOpen]);

  // Sync override price when service changes
  useEffect(() => {
    if (!editingOrder && services.length > 0) {
      const service = services.find(s => s.id === selectedServiceId);
      if (service) setOverridePrice(service.price.toString());
    }
  }, [selectedServiceId, services, editingOrder]);

  // Clean up quick add state
  // ... (rest of search and quick add states)
  
  // Search Search
  const [clinicSearch, setClinicSearch] = useState('');
  const [dentistSearch, setDentistSearch] = useState('');

  // Quick Add State
  const [isAddingDentist, setIsAddingDentist] = useState(false);
  const [newDentistName, setNewDentistName] = useState('');
  const [newDentistPhone, setNewDentistPhone] = useState('');

  const [isAddingClinic, setIsAddingClinic] = useState(false);
  const [newClinicName, setNewClinicName] = useState('');
  const [newClinicAddress, setNewClinicAddress] = useState('');

  const handleQuickAddClinic = async () => {
    if (!labId || !newClinicName) return;
    setLoading(true);
    setError('');
    try {
      const clinicData = {
        labId,
        name: newClinicName,
        address: newClinicAddress,
        phone: '',
      };

      const docRef = await addDoc(collection(db, `laboratories/${labId}/clinics`), clinicData);
      const newClinic = { id: docRef.id, ...clinicData } as Clinic;
      setClinics(prev => [newClinic, ...prev]);
      setSelectedClinicId(docRef.id);
      setIsAddingClinic(false);
      setNewClinicName('');
      setNewClinicAddress('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddDentist = async () => {
    if (!labId || !newDentistName) return;
    setLoading(true);
    setError('');
    try {
      const dentistData = {
        labId,
        name: newDentistName,
        phone: newDentistPhone,
        clinicId: selectedClinicId || null,
        clinicName: clinics.find(c => c.id === selectedClinicId)?.name || 'Independente',
      };

      const docRef = await addDoc(collection(db, `laboratories/${labId}/dentists`), dentistData);
      const newDentist = { id: docRef.id, ...dentistData } as Dentist;
      setDentists(prev => [newDentist, ...prev]);
      setSelectedDentistId(docRef.id);
      setIsAddingDentist(false);
      setNewDentistName('');
      setNewDentistPhone('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    if (!labId) return;

    try {
      // Fetch Clinics
      const clinicsSnap = await getDocs(query(collection(db, `laboratories/${labId}/clinics`)));
      setClinics(clinicsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Clinic)));

      // Fetch Services
      const servicesSnap = await getDocs(query(collection(db, `laboratories/${labId}/services`)));
      setServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));

      // Fetch All Dentists initially
      const dentistsSnap = await getDocs(query(collection(db, `laboratories/${labId}/dentists`)));
      setDentists(dentistsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Dentist)));
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const handleCreateOrder = async () => {
    if (!labId) {
      setError('Sessão expirada ou laboratório não identificado. Por favor, saia e entre novamente no sistema.');
      return;
    }

    if (!patientName || !selectedDentistId || !selectedServiceId) {
      setError('Dados incompletos. Verifique o paciente, dentista e serviço selecionado.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const total = parseFloat(overridePrice) || 0;

      const orderData = {
        labId,
        patientName,
        dentistId: selectedDentistId,
        clinicId: selectedClinicId || null,
        serviceId: selectedServiceId,
        total,
        shade: shades,
        shadeScale,
        arch,
        teeth,
        dueDate,
        notes,
        ...(editingOrder ? {} : { 
          orderNumber: `OS${Date.now().toString().slice(-6)}`,
          status: 'pending',
          createdAt: serverTimestamp(),
        })
      };

      if (editingOrder) {
        await updateDoc(doc(db, `laboratories/${labId}/orders`, editingOrder.id), {
          ...orderData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, `laboratories/${labId}/orders`), orderData);
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving order:', err);
      setError(`Erro ao gravar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  if (!isOpen) return null;

  const filteredClinics = clinics.filter(c => c.name.toLowerCase().includes(clinicSearch.toLowerCase()));
  const filteredDentists = dentists.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(dentistSearch.toLowerCase());
    const matchesClinic = selectedClinicId ? d.clinicId === selectedClinicId : true;
    return matchesSearch && matchesClinic;
  });

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
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl relative z-10 flex flex-col"
      >
        {/* Header */}
        <div className="bg-brand-deep p-8 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif">Nova <span className="italic font-semibold">Requisição</span></h2>
            <p className="text-white/50 text-[10px] uppercase font-black tracking-widest mt-1">Passo {step} de 4</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-between"
              >
                <span>{error}</span>
                <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-full">
                  <X size={12} />
                </button>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Nome do Paciente</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-brand-accent transition-colors" size={20} />
                      <input 
                        type="text" 
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Ex: João Silva"
                        className="w-full pl-12 pr-5 py-4 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-accent/20 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Clínica (Opcional)</label>
                       <button 
                        onClick={() => setIsAddingClinic(!isAddingClinic)}
                        className="text-[10px] font-black text-brand-salmon uppercase tracking-widest flex items-center gap-1 hover:text-brand-accent transition-colors"
                      >
                        {isAddingClinic ? <X size={10} /> : <Plus size={10} />} 
                      </button>
                    </div>
                    {isAddingClinic ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-brand-beige/20 p-4 rounded-2xl border border-brand-beige space-y-3"
                      >
                        <input 
                          type="text" 
                          placeholder="Nome da Clínica"
                          value={newClinicName}
                          onChange={(e) => setNewClinicName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-transparent rounded-xl focus:border-brand-accent/20 outline-none transition-all text-xs font-medium"
                        />
                        <button 
                          onClick={handleQuickAddClinic}
                          className="w-full py-2.5 bg-brand-deep text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-accent"
                        >
                          Salvar Clínica
                        </button>
                      </motion.div>
                    ) : (
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={20} />
                        <select 
                          value={selectedClinicId}
                          onChange={(e) => setSelectedClinicId(e.target.value)}
                          className="w-full pl-12 pr-10 py-4 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-accent/20 outline-none transition-all text-sm font-medium appearance-none"
                        >
                          <option value="">Clínica Independente</option>
                          {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Selecionar Dentista</label>
                    <button 
                      onClick={() => setIsAddingDentist(!isAddingDentist)}
                      className="text-[10px] font-black text-brand-salmon uppercase tracking-widest flex items-center gap-1 hover:text-brand-accent transition-colors"
                    >
                      {isAddingDentist ? <X size={12} /> : <Plus size={12} />} 
                      {isAddingDentist ? 'Cancelar' : 'Adicionar Novo'}
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {isAddingDentist && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-brand-beige/20 p-6 rounded-3xl border border-brand-beige space-y-4 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <input 
                            type="text" 
                            placeholder="Nome Completo do Dentista"
                            value={newDentistName}
                            onChange={(e) => setNewDentistName(e.target.value)}
                            className="w-full px-5 py-3 bg-white border border-transparent rounded-xl focus:border-brand-accent/20 outline-none transition-all text-sm font-medium"
                          />
                          <input 
                            type="text" 
                            placeholder="Telefone / WhatsApp"
                            value={newDentistPhone}
                            onChange={(e) => setNewDentistPhone(e.target.value)}
                            className="w-full px-5 py-3 bg-white border border-transparent rounded-xl focus:border-brand-accent/20 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <button 
                          onClick={handleQuickAddDentist}
                          disabled={loading || !newDentistName}
                          className="w-full py-3 bg-brand-deep text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-accent transition-all disabled:opacity-50"
                        >
                          Salvar e Selecionar
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredDentists.map(dentist => (
                      <button
                        key={dentist.id}
                        onClick={() => setSelectedDentistId(dentist.id)}
                        className={cn(
                          "p-6 rounded-3xl border transition-all text-left group relative overflow-hidden",
                          selectedDentistId === dentist.id 
                            ? "bg-brand-accent text-white border-brand-accent shadow-xl" 
                            : "bg-white border-neutral-100 hover:border-brand-accent/30 text-neutral-600"
                        )}
                      >
                        <p className={cn("text-xs font-bold", selectedDentistId === dentist.id ? "text-white" : "text-brand-deep")}>{dentist.name}</p>
                        <p className={cn("text-[9px] font-medium uppercase tracking-widest mt-1", selectedDentistId === dentist.id ? "text-white/70" : "text-neutral-400")}>{dentist.clinicName}</p>
                        {selectedDentistId === dentist.id && (
                          <Check size={16} className="absolute top-4 right-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Serviço Principal</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services.map(service => (
                      <button
                        key={service.id}
                        onClick={() => setSelectedServiceId(service.id)}
                        className={cn(
                          "p-6 rounded-3xl border transition-all text-left flex items-center justify-between group",
                          selectedServiceId === service.id 
                            ? "bg-brand-deep text-white border-brand-deep shadow-xl" 
                            : "bg-white border-neutral-100 hover:bg-brand-beige/20 text-neutral-600"
                        )}
                      >
                        <div>
                          <p className="text-sm font-bold">{service.name}</p>
                          <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", selectedServiceId === service.id ? "text-brand-salmon" : "text-neutral-300")}>R$ {service.price.toFixed(2)}</p>
                        </div>
                        <div className={cn(
                          "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                          selectedServiceId === service.id ? "bg-brand-accent border-brand-accent" : "border-neutral-100"
                        )}>
                          {selectedServiceId === service.id && <Check size={14} className="text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Escala de Cor</label>
                    <div className="flex flex-wrap gap-2">
                       {SHADE_SCALES.map(scale => (
                         <button 
                           key={scale}
                           onClick={() => setShadeScale(scale)}
                           className={cn(
                             "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all border",
                             shadeScale === scale ? "bg-brand-accent text-white border-brand-accent" : "bg-neutral-50 text-neutral-400 border-transparent hover:bg-neutral-100"
                           )}
                         >
                           {scale}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Cor Selecionada</label>
                     <div className="bg-neutral-50 p-6 rounded-3xl">
                       <div className="grid grid-cols-5 gap-2">
                         {SHADES.map(s => (
                           <button 
                             key={s}
                             onClick={() => {
                              setShades(prev => {
                                if (prev.includes(s)) return prev.filter(x => x !== s);
                                const limit = teeth.length <= 1 ? 2 : 12;
                                if (prev.length >= limit) return prev;
                                return [...prev, s];
                              });
                            }}
                             className={cn(
                               "w-full aspect-square text-[10px] font-black rounded-lg transition-all",
                               shades.includes(s) ? "bg-white text-brand-accent shadow-md scale-110" : "text-neutral-300 hover:text-neutral-500"
                             )}
                           >
                             {s}
                           </button>
                         ))}
                       </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="flex bg-neutral-100/50 p-1.5 rounded-full border border-neutral-100">
                    {(['superior', 'inferior', 'both'] as const).map(a => (
                      <button 
                        key={a}
                        onClick={() => setArch(a)}
                        className={cn(
                          "px-8 py-2.5 text-[10px] font-black tracking-widest uppercase rounded-full transition-all",
                          arch === a ? "bg-white shadow-xl text-brand-accent" : "text-neutral-400 hover:text-neutral-600"
                        )}
                      >
                        {a === 'both' ? 'Ambas' : a}
                      </button>
                    ))}
                  </div>

                  <ToothSelector selectedTeeth={teeth} onToggle={setTeeth} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Observações e Detalhes Adicionais</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Especifique detalhes da técnica, texturas, translucidez ou caracterizações especiais..."
                    rows={4}
                    className="w-full px-6 py-4 bg-neutral-50 border border-transparent rounded-[2rem] focus:bg-white focus:border-brand-accent/20 outline-none transition-all text-sm font-medium resize-none"
                  />
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="bg-brand-beige/30 p-10 rounded-[3rem] border border-brand-beige flex flex-col md:flex-row gap-10 items-center">
                  <div className="flex-1 space-y-6">
                    <h3 className="text-3xl font-serif text-brand-deep">Resumo do <span className="font-semibold italic">Trabalho</span></h3>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm py-2 border-b border-brand-beige">
                        <span className="text-neutral-400 font-medium">Paciente</span>
                        <span className="text-brand-deep font-bold">{patientName}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-brand-beige">
                        <span className="text-neutral-400 font-medium">Dente(s)</span>
                        <span className="text-brand-deep font-bold">{teeth.length > 0 ? teeth.join(', ') : 'Toda arcada'}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-brand-beige">
                        <span className="text-neutral-400 font-medium">Cor(es)</span>
                        <span className="text-brand-accent font-black uppercase tracking-widest">{shades.join(', ')} ({shadeScale})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-px h-32 bg-brand-beige hidden md:block" />

                  <div className="space-y-6 w-full md:w-auto">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Data de Entrega</label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" size={18} />
                        <input 
                          type="date" 
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full pl-12 pr-5 py-4 bg-white border border-transparent rounded-2xl focus:border-brand-accent/20 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                    
                    <div className="p-6 bg-brand-deep rounded-3xl text-white">
                       <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Investimento Total (R$)</p>
                       <input 
                         type="number"
                         value={overridePrice}
                         onChange={(e) => setOverridePrice(e.target.value)}
                         className="bg-transparent border-none outline-none text-3xl font-serif font-black mt-1 w-full text-white"
                       />
                    </div>
                  </div>
                </div>

  // Cleanup error display at the bottom of step 4
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <button 
            onClick={prevStep}
            disabled={step === 1 || loading}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-full transition-all",
              step === 1 ? "opacity-0 pointer-events-none" : "text-neutral-400 hover:text-brand-deep hover:bg-neutral-100"
            )}
          >
            <ChevronLeft size={16} /> Voltar
          </button>
          
          <div className="flex items-center gap-2">
            {[1,2,3,4].map(i => (
              <div 
                key={i} 
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-500",
                  step === i ? "w-6 bg-brand-accent" : i < step ? "bg-brand-deep" : "bg-neutral-200"
                )} 
              />
            ))}
          </div>

          <button 
            onClick={step === 4 ? handleCreateOrder : nextStep}
            disabled={
              loading || 
              (step === 1 && (!patientName || !selectedDentistId)) ||
              (step === 2 && !selectedServiceId) ||
              (step === 4 && !dueDate)
            }
            className="flex items-center gap-3 px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white bg-brand-deep rounded-full hover:bg-brand-accent hover:shadow-xl hover:shadow-brand-accent/20 transition-all disabled:opacity-50"
          >
            {step === 4 ? (loading ? 'Processando...' : 'Finalizar Pedido') : 'Continuar'}
            {step < 4 && !loading && <ChevronRight size={18} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
