import React, { useState, useEffect } from 'react';
import { Package, Tag, Layers, Database, Plus, Search, Edit2, ChevronRight, Star, Clock, X, Trash2, Check, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLaboratory } from '../context/LaboratoryContext';
import { Service } from '../types';
import { cn } from '../lib/utils';
import { CATEGORY_LABELS, COMMON_SERVICES } from '../constants';

export default function ConfigPage() {
  const { labId, setActivePage, isOwner } = useLaboratory();
  const [activeTab, setActiveTab] = React.useState('fixed');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // New/Edit Service Form
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('fixed');
  const [newLeadTime, setNewLeadTime] = useState('7');

  useEffect(() => {
    if (!labId) return;

    const q = query(collection(db, `laboratories/${labId}/services`));
    const unsubscribe = onSnapshot(q, (snap) => {
      const servicesData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Service));
      setServices(servicesData);
      setLoading(false);
    });

    return () => unsubscribe?.();
  }, [labId]);

  const handleSeedServices = async () => {
    if (!labId) return;
    setLoading(true);

    try {
      const batch = writeBatch(db);
      COMMON_SERVICES.forEach(s => {
        const ref = doc(collection(db, `laboratories/${labId}/services`));
        batch.set(ref, { ...s, labId, createdAt: new Date() });
      });
      await batch.commit();
    } catch (err: any) {
      alert(`Erro ao inicializar serviços: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveService = async () => {
    if (!labId || !newName || !newPrice) return;
    setLoading(true);
    
    try {
      const serviceData = {
        labId,
        name: newName,
        price: parseFloat(newPrice),
        category: newCategory,
        leadTime: parseInt(newLeadTime) || 7,
      };

      if (editingId) {
        await updateDoc(doc(db, `laboratories/${labId}/services`, editingId), serviceData);
      } else {
        await addDoc(collection(db, `laboratories/${labId}/services`), serviceData);
      }

      setIsAdding(false);
      setEditingId(null);
      setNewName('');
      setNewPrice('');
      setNewLeadTime('7');
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!labId) return;
    if (!confirm('Deseja realmente excluir este serviço?')) return;
    try {
      await deleteDoc(doc(db, `laboratories/${labId}/services`, id));
    } catch (err: any) {
      console.error('Falha ao apagar serviço:', err);
      alert(`Erro: ${err.message}`);
    }
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setNewName(service.name);
    setNewPrice(service.price.toString());
    setNewCategory(service.category);
    setNewLeadTime((service.leadTime || 7).toString());
    setIsAdding(true);
  };

  const filteredServices = services.filter(s => 
    s.category === activeTab &&
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-serif font-light text-brand-deep leading-tight italic">
            Catálogo de <span className="font-bold not-italic font-serif">Artesania</span>
          </h2>
          <p className="text-[10px] font-black text-brand-salmon uppercase tracking-[0.3em]">
            Gestão de Soluções e Honorários
          </p>
        </div>
        {isOwner && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-3 px-8 py-3 text-[10px] font-black tracking-widest uppercase text-white bg-brand-salmon rounded-full hover:bg-brand-deep hover:shadow-2xl hover:shadow-brand-salmon/20 transition-all shadow-lg active:scale-95"
          >
            <Plus size={18} />
            Novo Registro
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            className="bg-white p-10 rounded-[3.5rem] border border-[#F5F2EF] shadow-2xl flex flex-col md:flex-row gap-8 items-end relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-salmon/5 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="flex-1 space-y-3 w-full">
              <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Descrição</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Zircônia Monolítica"
                className="w-full h-14 px-6 bg-brand-beige/30 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-brand-salmon/20 outline-none transition-all text-sm font-bold placeholder:text-neutral-300"
              />
            </div>
            
            <div className="w-full md:w-40 space-y-3">
              <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Preço (R$)</label>
              <input 
                type="number" 
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-14 px-6 bg-brand-beige/30 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-brand-salmon/20 outline-none transition-all text-sm font-bold"
              />
            </div>

            <div className="w-full md:w-32 space-y-3">
              <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Prazo (d)</label>
              <input 
                type="number" 
                value={newLeadTime}
                onChange={(e) => setNewLeadTime(e.target.value)}
                placeholder="7"
                className="w-full h-14 px-6 bg-brand-beige/30 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-brand-salmon/20 outline-none transition-all text-sm font-bold"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={handleSaveService}
                className="flex-1 h-14 bg-brand-deep text-white text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] hover:bg-brand-salmon transition-all flex items-center justify-center gap-2 px-8"
              >
                <Check size={18} />
                Confirmar
              </button>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setNewName('');
                  setNewPrice('');
                }}
                className="w-14 h-14 bg-brand-beige text-neutral-400 rounded-[1.25rem] hover:text-brand-salmon transition-all flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <div className="space-y-3">
            <p className="px-6 text-[10px] font-black text-brand-salmon/50 uppercase tracking-[0.3em] mb-4">Especialidades</p>
            <div className="flex lg:flex-col gap-3 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
              {Object.entries(CATEGORY_LABELS).map(([key, { label, icon: Icon }]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    "flex-none lg:w-full flex items-center justify-between px-7 py-5 rounded-[2rem] transition-all duration-500 group relative overflow-hidden",
                    activeTab === key 
                      ? "bg-brand-deep text-white shadow-2xl shadow-brand-deep/20 scale-[1.02]" 
                      : "bg-white text-neutral-400 hover:bg-white/50 border border-[#F5F2EF]"
                  )}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <Icon size={22} className={cn("transition-colors", activeTab === key ? "text-brand-salmon" : "text-neutral-300")} />
                    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
                  </div>
                  <ChevronRight size={16} className={cn("hidden lg:block transition-all", activeTab === key ? "opacity-100 translate-x-0 text-brand-salmon" : "opacity-0 -translate-x-2")} />
                </button>
              ))}
            </div>
          </div>

          {isOwner && services.length === 0 && !loading && (
            <button 
              onClick={handleSeedServices}
              className="w-full group p-8 rounded-[2.5rem] bg-brand-salmon/5 border-2 border-dashed border-brand-salmon/20 flex flex-col items-center text-center hover:bg-brand-salmon hover:border-brand-salmon transition-all"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-salmon mb-4 group-hover:scale-110 transition-transform">
                <PlusCircle size={28} />
              </div>
              <span className="text-[10px] font-black text-brand-salmon uppercase tracking-widest group-hover:text-white">Carregar Modelos Comuns</span>
            </button>
          )}

          <div className="p-10 rounded-[3rem] bg-brand-deep text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-salmon/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
            <h4 className="font-serif text-2xl relative z-10 italic leading-none">Honorários <br/><span className="font-bold not-italic">Vips</span></h4>
            <p className="text-[9px] mt-4 text-white/50 font-black uppercase tracking-wider leading-relaxed">Personalize valores para <br/>parceiros estratégicos.</p>
            <button 
              onClick={() => setActivePage('clients')}
              className="mt-10 w-full py-4 bg-brand-salmon text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-white hover:text-brand-deep shadow-xl shadow-brand-salmon/20 transition-all relative z-10"
            >
              Ajustar Portfólio
            </button>
          </div>
        </div>

        {/* Content Listing */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white h-20 px-10 rounded-full border border-[#F5F2EF] flex items-center gap-6 shadow-sm focus-within:shadow-xl focus-within:shadow-brand-salmon/5 transition-all text-brand-deep">
             <Search size={22} className="text-brand-salmon/40" />
             <input 
               type="text" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Buscar procedimentos ou códigos..."
               className="bg-transparent border-none outline-none text-sm font-bold placeholder:text-neutral-300 w-full tracking-tight"
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredServices.map((service, idx) => (
                <motion.div 
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-[#F5F2EF] shadow-sm hover:shadow-2xl hover:shadow-brand-salmon/5 transition-all group flex flex-col justify-between min-h-[220px]"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 bg-brand-beige rounded-xl flex items-center justify-center text-brand-salmon font-bold text-[10px]">
                        {service.id.slice(-2).toUpperCase()}
                      </div>
                      {isOwner && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={(e) => { e.stopPropagation(); startEdit(service); }}
                            className="p-2 text-neutral-300 hover:text-brand-salmon hover:bg-brand-salmon/5 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(service.id); }}
                            className="p-2 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <h4 className="text-lg font-serif font-bold text-brand-deep group-hover:text-brand-salmon transition-colors italic leading-snug">{service.name}</h4>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-brand-beige flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-brand-salmon uppercase tracking-[0.2em] mb-1">Honorários</span>
                      <span className="text-2xl font-serif font-black text-brand-deep">R$ {service.price.toFixed(0)}<span className="text-sm font-normal">,00</span></span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-deep text-white text-[9px] font-black rounded-xl uppercase tracking-widest">
                      <Clock size={12} className="text-brand-salmon" />
                      {service.leadTime || 7}d
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredServices.length === 0 && !loading && (
              <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-brand-beige flex flex-col items-center">
                <div className="w-20 h-20 bg-brand-beige/50 rounded-[2rem] flex items-center justify-center text-brand-salmon/20 mb-6">
                  <Package size={40} />
                </div>
                <h3 className="text-2xl font-serif text-brand-deep italic">Nenhum registro encontrado</h3>
                <p className="text-[10px] font-black text-neutral-400 mt-4 uppercase tracking-[0.2em]">Inicie o catálogo para visualizar os procedimentos.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
