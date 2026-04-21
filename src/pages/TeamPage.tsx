import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  MoreVertical, 
  Plus, 
  Search,
  Activity,
  UserCheck,
  UserX,
  PlusCircle,
  X,
  Trash2,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCircle,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc,
  where,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useLaboratory } from '../context/LaboratoryContext';
import { cn } from '../lib/utils';

interface TeamMember {
  id: string;
  displayName: string;
  email: string;
  role: 'owner' | 'technician' | 'secretary' | 'assistant';
  active: boolean;
  labId: string;
  status: 'approved' | 'pending';
}

const ROLE_LABELS = {
  owner: 'Proprietário',
  technician: 'Protesista',
  secretary: 'Secretariado',
  assistant: 'Assistente Lab'
};

export default function TeamPage() {
  const { labId, userData, candidates, hireCollaborator, linkByCode, allLabs } = useLaboratory();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWiping, setIsWiping] = useState(false);
  const [isHiringModalOpen, setIsHiringModalOpen] = useState(false);
  const [hiringProcessing, setHiringProcessing] = useState<string | null>(null);
  const [expertCode, setExpertCode] = useState('');
  const [hiringError, setHiringError] = useState<string | null>(null);

  const isOwner = userData?.role === 'owner';

  useEffect(() => {
    if (!labId) return;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('labId', '==', labId));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const team = snap.docs.map(d => ({ id: d.id, ...d.data() } as TeamMember));
      setMembers(team);
      setLoading(false);
    });

    return () => unsubscribe?.();
  }, [labId]);

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'users', id), {
        status: 'approved',
        active: false
      });
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleChangeRole = async (id: string, newRole: TeamMember['role']) => {
    try {
      await updateDoc(doc(db, 'users', id), { role: newRole });
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleRemove = async (id: string) => {
    if (id === auth.currentUser?.uid) return;
    try {
      if (confirm('Tem certeza que deseja remover este membro da equipe?')) {
        await deleteDoc(doc(db, 'users', id));
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const wipeDatabase = async () => {
    if (!confirm('DANGER: Isso vai apagar TODOS os dados do laboratório (Ordens, Clientes, Financeiro). Esta ação é irreversível. Deseja continuar?')) return;
    
    setIsWiping(true);
    try {
      const collections = ['orders', 'dentists', 'clinics', 'services', 'transactions'];
      const batch = writeBatch(db);
      
      for (const colName of collections) {
        const q = query(collection(db, colName), where('labId', '==', labId));
        const snap = await getDocs(q);
        snap.docs.forEach(d => batch.delete(d.ref));
      }
      
      await batch.commit();
      alert('Banco de dados limpo com sucesso.');
    } catch (err: any) {
      alert(`Erro ao limpar: ${err.message}`);
    } finally {
      setIsWiping(false);
    }
  };

  const approvedMembers = members.filter(m => m.status === 'approved');
  const pendingMembers = members.filter(m => m.status === 'pending');
  const isIframe = window.self !== window.top;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 bg-white p-10 md:p-14 rounded-[3rem] shadow-xl border border-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-salmon/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="z-10">
          <h2 className="text-4xl md:text-6xl font-serif text-brand-deep italic font-light leading-none">Gestão de <br/><span className="font-bold not-italic font-serif text-brand-salmon">Talentos</span></h2>
          <p className="text-neutral-400 text-xs md:text-sm font-medium mt-6 max-w-md leading-relaxed">
            Consolide sua equipe de especialistas e monitore a produtividade do seu atelier em tempo real.
          </p>
        </div>
        
        {isOwner && (
          <div className="flex flex-col sm:flex-row gap-6 shrink-0 z-10">
            <button 
              onClick={() => setIsHiringModalOpen(true)}
              className="px-8 py-4 bg-white text-brand-salmon border border-brand-salmon/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-salmon hover:text-white transition-all shadow-xl shadow-brand-salmon/5 flex items-center gap-3"
            >
              <UserPlus size={16} />
              Vincular Especialista
            </button>

            <div className="bg-brand-beige/50 p-6 rounded-3xl border border-white shadow-inner flex flex-col gap-3 min-w-[280px] group transition-all hover:bg-white">
              <span className="text-[9px] font-black text-brand-salmon uppercase tracking-[0.2em]">Código da Empresa</span>
              <div className="flex items-center justify-between gap-4">
                 <div className="text-3xl font-mono font-black text-brand-deep tracking-widest">
                   {allLabs.find(l => l.id === labId)?.inviteCode || "---"}
                 </div>
                 <button 
                  onClick={() => {
                    const code = allLabs.find(l => l.id === labId)?.inviteCode;
                    if (code) {
                      navigator.clipboard.writeText(code);
                      alert('Código de convite copiado!');
                    }
                  }}
                  className="p-3 bg-brand-salmon text-white rounded-2xl shadow-lg shadow-brand-salmon/20 hover:bg-brand-deep transition-all group-hover:scale-110"
                 >
                   <CheckCircle2 size={20} />
                 </button>
              </div>
              <p className="text-[8px] text-neutral-400 font-bold uppercase tracking-widest italic">Compartilhe para vincular sua equipe</p>
            </div>
          </div>
        )}
      </header>

      {/* Lab Members Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 px-2">
           <div className="w-1.5 h-1.5 bg-brand-salmon rounded-full" />
           <h3 className="text-[10px] font-black text-brand-deep uppercase tracking-[0.3em]">Membros Ativos ({approvedMembers.length})</h3>
           <div className="h-px flex-1 bg-neutral-200/50" />
        </div>

        {approvedMembers.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-md rounded-[3rem] p-20 text-center border border-white border-dashed">
            <Users size={48} className="mx-auto text-neutral-200 mb-6" />
            <p className="text-neutral-400 font-serif italic text-lg text-center">Nenhum colaborador vinculado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {approvedMembers.map((member) => (
              <motion.div 
                key={member.id}
                whileHover={{ y: -8 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-white flex flex-col items-center text-center relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4">
                  <div className={cn("w-2 h-2 rounded-full shadow-lg transition-all", member.active ? "bg-emerald-500 shadow-emerald-500/50 animate-pulse" : "bg-neutral-200")} />
                </div>
                <div className="w-24 h-24 bg-brand-beige border border-brand-salmon/10 rounded-[2rem] flex items-center justify-center text-3xl font-serif font-black text-brand-salmon mb-6 shadow-sm group-hover:bg-brand-salmon group-hover:text-white transition-all transform group-hover:rotate-6">
                  {member.displayName?.charAt(0)}
                </div>
                <h4 className="text-xl font-serif text-brand-deep font-bold mb-1 truncate w-full px-4">{member.displayName}</h4>
                <p className="text-[9px] font-black text-brand-salmon uppercase tracking-[0.2em] mb-6">{ROLE_LABELS[member.role]}</p>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="bg-brand-beige/50 p-4 rounded-2xl border border-white text-left">
                    <p className="text-[7px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Status</p>
                    <p className={cn("text-[9px] font-bold uppercase", member.active ? "text-emerald-600" : "text-neutral-400")}>{member.active ? 'Ativo' : 'Offline'}</p>
                  </div>
                  <div className="bg-brand-beige/50 p-4 rounded-2xl border border-white text-left">
                    <p className="text-[7px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Frequência</p>
                    <p className="text-[9px] font-bold text-brand-deep uppercase">Consistente</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-50 w-full flex justify-between items-center px-2">
                  <div className="flex flex-col items-start translate-y-1">
                    <span className="text-[8px] font-bold text-neutral-300 uppercase">Acesso</span>
                    <span className="text-[10px] font-bold text-neutral-500 lowercase">{member.email.split('@')[0]}...</span>
                  </div>
                  {isOwner && member.id !== auth.currentUser?.uid && (
                    <button 
                      onClick={() => handleRemove(member.id)}
                      className="p-3 bg-neutral-50 text-neutral-400 rounded-xl hover:bg-rose-50 hover:text-rose-400 transition-all"
                    >
                       <X size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Section */}
      {isOwner && pendingMembers.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
             <div className="w-1.5 h-1.5 bg-brand-salmon rounded-full" />
             <h3 className="text-[10px] font-black text-brand-deep uppercase tracking-[0.3em]">Solicitações Pendentes</h3>
             <div className="h-px flex-1 bg-neutral-200/50" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingMembers.map(member => (
              <motion.div 
                key={member.id}
                className="bg-white p-6 rounded-3xl border border-brand-salmon/10 shadow-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-beige rounded-2xl flex items-center justify-center text-brand-salmon font-serif text-xl border border-brand-salmon/5 shadow-sm">
                    {member.displayName?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-deep">{member.displayName}</h4>
                    <p className="text-[11px] text-neutral-400">{member.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(member.id)} className="p-3 bg-brand-salmon text-white rounded-2xl hover:bg-emerald-500 transition-all">
                    <Check size={18} />
                  </button>
                  <button onClick={() => handleRemove(member.id)} className="p-3 bg-neutral-50 text-neutral-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                    <X size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Recruitment / Marketplace Section */}
      {isOwner && (
        <section className="space-y-10 pt-12 pb-32">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 bg-brand-salmon rounded-full" />
              <h3 className="text-[10px] font-black text-brand-deep uppercase tracking-[0.3em]">Recrutamento & Talentos</h3>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-xl rounded-[4rem] p-10 md:p-16 border border-white">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
              {candidates.length > 0 ? (
                candidates.map((cand) => (
                  <motion.div 
                    key={cand.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-[3rem] shadow-2xl border border-white flex flex-col group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-salmon/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-salmon/10 transition-all" />
                    
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-16 h-16 bg-brand-beige border border-brand-salmon/10 rounded-2xl flex items-center justify-center text-xl font-serif font-black text-brand-salmon shadow-sm transition-transform group-hover:scale-110">
                        {cand.displayName?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-lg font-serif font-bold text-brand-deep leading-tight truncate max-w-[140px] uppercase tracking-wide">{cand.displayName}</h4>
                        <span className="inline-block mt-2 px-3 py-1 bg-brand-salmon/10 rounded-full text-[8px] font-bold text-brand-salmon uppercase tracking-widest">Disponível</span>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                       <div className="flex items-center justify-between p-4 bg-brand-beige/30 rounded-2xl border border-neutral-50">
                          <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">Código Individual</span>
                          <span className="text-xs font-mono font-bold text-brand-deep">{cand.accessCode}</span>
                       </div>
                    </div>

                    <p className="text-[9px] text-neutral-400 leading-relaxed font-medium mb-10 pl-2 border-l-2 border-brand-salmon/30 italic">
                      Especialista pronto para novos fluxos de trabalho. Aguardando convite de laboratório.
                    </p>

                    <button 
                      onClick={() => hireCollaborator(cand.uid, 'technician')}
                      className="w-full py-4 bg-brand-beige text-brand-salmon font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-salmon hover:text-white transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95"
                    >
                      Formalizar Convite
                      <UserCheck size={16} />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center">
                   <div className="w-20 h-20 bg-brand-beige rounded-full flex items-center justify-center text-neutral-200 mx-auto mb-6 shadow-inner">
                      <Search size={32} />
                   </div>
                   <p className="text-neutral-400 font-serif italic text-lg">Nenhum novo talento orbitando seu laboratório no momento.</p>
                   <p className="text-[9px] font-bold text-brand-salmon uppercase tracking-widest mt-4">Os especialistas aparecem aqui quando ativam o perfil de equipe</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {isOwner && (
        <section className="bg-rose-50/50 p-10 rounded-[3rem] border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-8 group hover:bg-rose-50 transition-all">
          <div>
            <h4 className="text-xl font-serif text-brand-deep font-bold italic">Zona de Segurança</h4>
            <p className="text-xs font-medium text-neutral-500 mt-2">Apague permanentemente todos os registros de produção deste laboratório.</p>
          </div>
          <button 
            onClick={wipeDatabase}
            disabled={isWiping}
            className="flex items-center gap-3 px-8 py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20"
          >
            <Trash2 size={16} />
            {isWiping ? 'Limpando...' : 'Zerar Banco de Dados'}
          </button>
        </section>
      )}

      {isHiringModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
          <div onClick={() => setIsHiringModalOpen(false)} className="absolute inset-0 bg-brand-deep/60 backdrop-blur-md" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[4rem] p-12 max-w-lg w-full relative z-10 shadow-2xl"
          >
            <h3 className="text-2xl font-serif text-brand-deep mb-2 font-light italic">Inserir <span className="font-bold not-italic">Código</span></h3>
            <p className="text-neutral-400 text-xs font-medium mb-8">Vincule um especialista que já possui conta ativa.</p>
            
            <input 
              type="text"
              value={expertCode}
              onChange={(e) => setExpertCode(e.target.value.toUpperCase())}
              placeholder="CÓDIGO DE 6 DÍGITOS"
              maxLength={6}
              className="w-full bg-brand-beige border border-transparent rounded-2xl px-6 py-4 text-center text-2xl font-mono font-black tracking-[0.4em] text-brand-deep focus:border-brand-salmon/20 outline-none mb-6"
            />
            
            {hiringError && <p className="text-rose-500 text-[10px] font-bold uppercase mb-6 text-center">{hiringError}</p>}
            
            <button 
              onClick={async () => {
                const trimmed = expertCode.trim();
                if (trimmed.length < 6) return;
                setHiringProcessing('code');
                try {
                  await linkByCode(trimmed, 'technician');
                  setIsHiringModalOpen(false);
                  alert('Vínculo estabelecido com sucesso!');
                } catch(e: any) {
                  setHiringError(e.message);
                } finally {
                  setHiringProcessing(null);
                }
              }}
              disabled={expertCode.length < 6 || !!hiringProcessing}
              className="w-full py-5 bg-brand-deep text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-brand-salmon transition-all"
            >
              {hiringProcessing === 'code' ? 'Validando...' : 'Vincular Agora'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
