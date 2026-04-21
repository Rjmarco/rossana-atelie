import React, { useState, useEffect } from 'react';
import { Phone, MapPin, MoreVertical, Plus, Search, User, FileText, Building2, Trash2, ArrowUpRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  deleteDoc,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLaboratory } from '../context/LaboratoryContext';
import { Dentist, Clinic } from '../types';
import { cn } from '../lib/utils';
import DentistModal from '../components/DentistModal';
import ClinicModal from '../components/ClinicModal';

export default function ClientsPage() {
  const { labId } = useLaboratory();
  const [activeTab, setActiveTab] = useState<'dentists' | 'clinics'>('dentists');
  const [searchTerm, setSearchTerm] = useState('');
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDentistModalOpen, setIsDentistModalOpen] = useState(false);
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
  const [editingDentist, setEditingDentist] = useState<Dentist | null>(null);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [filterClinicId, setFilterClinicId] = useState<string | null>(null);

  useEffect(() => {
    if (!labId) return;

    const unsubscribeDentists = onSnapshot(collection(db, `laboratories/${labId}/dentists`), (snap) => {
      setDentists(snap.docs.map(d => ({ id: d.id, ...d.data() } as Dentist)));
    });

    const unsubscribeClinics = onSnapshot(collection(db, `laboratories/${labId}/clinics`), (snap) => {
      setClinics(snap.docs.map(d => ({ id: d.id, ...d.data() } as Clinic)));
      setLoading(false);
    });

    const unsubscribeOrders = onSnapshot(collection(db, `laboratories/${labId}/orders`), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeDentists();
      unsubscribeClinics();
      unsubscribeOrders();
    };
  }, [labId]);

  const handleDeleteDentist = async (id: string, name: string) => {
    if (!labId) return;
    try {
      await deleteDoc(doc(db, `laboratories/${labId}/dentists`, id));
    } catch (err: any) {
      console.error('Falha ao apagar dentista:', err);
      alert(`Erro: ${err.message}`);
    }
  };

  const handleDeleteClinic = async (id: string, name: string) => {
    if (!labId) return;
    try {
      await deleteDoc(doc(db, `laboratories/${labId}/clinics`, id));
    } catch (err: any) {
      console.error('Falha ao apagar clínica:', err);
      alert(`Erro: ${err.message}`);
    }
  };

  const filteredDentists = dentists.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.clinicName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClinic = filterClinicId ? c.clinicId === filterClinicId : true;
    return matchesSearch && matchesClinic;
  });

  const filteredClinics = clinics.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-10">
      <div className="flex flex-row flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-light text-brand-deep">Gestão de <span className="font-semibold italic">Parceria</span></h2>
          <p className="text-neutral-400 text-sm font-medium tracking-wide mt-1">Curadoria de profissionais e clínicas de odontologia premium.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
           <button 
             onClick={() => setIsClinicModalOpen(true)}
             className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 text-[10px] font-black tracking-widest uppercase text-brand-accent bg-white border border-brand-accent/20 rounded-full hover:bg-brand-accent hover:text-white transition-all shadow-lg shadow-brand-accent/5 active:scale-95"
           >
             <Building2 size={16} />
             <span className="truncate">Clínica</span>
           </button>
           <button 
             onClick={() => setIsDentistModalOpen(true)}
             className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 text-[10px] font-black tracking-widest uppercase text-white bg-brand-deep rounded-full hover:bg-brand-accent hover:shadow-xl transition-all shadow-lg active:scale-95"
           >
             <Plus size={18} />
             <span className="truncate">Parceiro</span>
           </button>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8 justify-between">
        <div className="flex bg-neutral-100 p-1.5 rounded-[1.5rem] w-full lg:w-fit overflow-x-auto no-scrollbar">
          <button 
            onClick={() => {
              setActiveTab('dentists');
              setFilterClinicId(null);
            }}
            className={cn(
              "flex-1 lg:flex-none px-6 lg:px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
              activeTab === 'dentists' ? "bg-white shadow-xl text-brand-accent" : "text-neutral-400"
            )}
          >
            Dentistas ({dentists.length})
          </button>
          <button 
            onClick={() => {
              setActiveTab('clinics');
              setFilterClinicId(null);
            }}
            className={cn(
              "flex-1 lg:flex-none px-6 lg:px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
              activeTab === 'clinics' ? "bg-white shadow-xl text-brand-accent" : "text-neutral-400"
            )}
          >
            Clínicas ({clinics.length})
          </button>
        </div>

        <div className="flex-1 max-w-xl relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-brand-accent transition-colors" size={20} />
          <input 
            type="text" 
            placeholder={activeTab === 'dentists' ? "Buscar dentista por nome ou clínica..." : "Buscar clínica por nome fantasia..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-4 bg-white border border-[#F5F2EF] rounded-full shadow-sm focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 outline-none transition-all text-sm font-medium"
          />
          {filterClinicId && activeTab === 'dentists' && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-[9px] font-black text-brand-accent uppercase bg-brand-accent/10 px-3 py-1 rounded-full">Filtro Ativo</span>
              <button onClick={() => setFilterClinicId(null)} className="p-1 hover:bg-neutral-100 rounded-full text-neutral-400">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {activeTab === 'dentists' ? (
          filteredDentists.map((client, idx) => (
            <motion.div 
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-8 rounded-[2.5rem] border border-[#F5F2EF] shadow-sm hover:shadow-2xl hover:shadow-brand-accent/10 transition-all group flex flex-col h-full relative"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-16 h-16 bg-brand-beige rounded-2xl flex items-center justify-center text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-all transform group-hover:rotate-6 shadow-sm">
                  <User size={32} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingDentist(client);
                      setIsDentistModalOpen(true);
                    }}
                    className="p-3 text-neutral-400 hover:text-brand-deep hover:bg-neutral-50 rounded-full transition-all"
                    title="Editar Registro"
                  >
                    <MoreVertical size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteDentist(client.id, client.name)}
                    className="p-3 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                    title="Apagar Registro"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-serif text-brand-deep group-hover:text-brand-accent transition-colors">{client.name}</h3>
                <p className="text-[10px] font-black text-brand-salmon uppercase tracking-widest mt-1">{client.clinicName}</p>
                
                <div className="mt-8 space-y-4">
                  {client.phone && (
                    <div className="flex items-center gap-3 text-sm text-neutral-500 font-medium">
                      <Phone size={16} className="text-neutral-300" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-neutral-500 font-medium">
                    <MapPin size={16} className="text-neutral-300" />
                    <span className="truncate">{client.address || 'Endereço não cadastrado'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-[#F5F2EF] flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Saldo Mensal</p>
                  <p className="text-lg font-serif font-black text-brand-deep">
                    R$ {orders.filter(o => o.dentistId === client.id).reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}
                  </p>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="px-5 py-2 text-[10px] font-black tracking-widest uppercase text-brand-accent bg-brand-accent/5 rounded-full hover:bg-brand-accent hover:text-white transition-all flex items-center gap-2 no-print"
                >
                  <FileText size={12} />
                  Extrato
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          filteredClinics.map((clinic, idx) => (
            <motion.div 
              key={clinic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-8 rounded-[2.5rem] border border-[#F5F2EF] shadow-sm hover:shadow-2xl hover:shadow-brand-accent/10 transition-all group flex flex-col h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-beige/20 -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-700" />
              
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="w-16 h-16 bg-white border border-[#F5F2EF] rounded-2xl flex items-center justify-center text-brand-salmon group-hover:bg-brand-salmon group-hover:text-white transition-all shadow-sm">
                  <Building2 size={32} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingClinic(clinic);
                      setIsClinicModalOpen(true);
                    }}
                    className="p-3 text-neutral-400 hover:text-brand-deep hover:bg-neutral-50 rounded-full transition-all"
                  >
                    <MoreVertical size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteClinic(clinic.id, clinic.name)}
                    className="p-3 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 relative z-10">
                <h3 className="text-xl font-serif text-brand-deep group-hover:text-brand-salmon transition-colors">{clinic.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                   <div className="px-2 py-0.5 bg-neutral-100 rounded text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                     {dentists.filter(d => d.clinicId === clinic.id).length} Dentistas Ativos
                   </div>
                </div>
                
                <div className="mt-8 space-y-4">
                  {clinic.phone && (
                    <div className="flex items-center gap-3 text-sm text-neutral-500 font-medium">
                      <Phone size={16} className="text-neutral-300" />
                      <span>{clinic.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-neutral-500 font-medium">
                    <MapPin size={16} className="text-neutral-300" />
                    <span className="truncate">{clinic.address || 'Endereço não cadastrado'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-[#F5F2EF] flex items-center justify-between relative z-10">
                 <button 
                   onClick={() => {
                     setFilterClinicId(clinic.id);
                     setActiveTab('dentists');
                   }}
                   className="w-full py-3 bg-neutral-50 hover:bg-brand-deep hover:text-white text-[10px] font-black uppercase tracking-widest text-neutral-400 rounded-2xl transition-all flex items-center justify-center gap-2"
                 >
                   Ver Equipe
                   <ArrowUpRight size={14} />
                 </button>
              </div>
            </motion.div>
          ))
        )}

        {(activeTab === 'dentists' ? filteredDentists : filteredClinics).length === 0 && (
          <div className="col-span-full py-20 text-center bg-brand-beige/10 rounded-[3rem] border-2 border-dashed border-brand-beige">
            <User size={48} className="mx-auto text-brand-beige mb-4" />
            <h3 className="text-xl font-serif text-brand-deep italic">Nenhum parceiro encontrado</h3>
            <p className="text-sm text-neutral-400 mt-1">Experimente mudar o termo de busca ou cadastrar um novo profissional.</p>
          </div>
        )}
      </div>

      <DentistModal 
        isOpen={isDentistModalOpen} 
        onClose={() => {
          setIsDentistModalOpen(false);
          setEditingDentist(null);
        }} 
        editingDentist={editingDentist}
      />
      <ClinicModal 
        isOpen={isClinicModalOpen} 
        onClose={() => {
          setIsClinicModalOpen(false);
          setEditingClinic(null);
        }} 
        onSuccess={() => setActiveTab('clinics')}
        editingClinic={editingClinic}
      />
    </div>
  );
}
