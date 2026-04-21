import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Users, 
  Search, 
  CheckCircle2, 
  Clock, 
  LogOut,
  Plus,
  ArrowRight,
  Sparkles,
  Heart,
  AlertCircle
} from 'lucide-react';
import { useLaboratory } from '../context/LaboratoryContext';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export default function OnboardingScreen() {
  const { userData, createLab, becomeCandidate, joinLabByInviteCode, cancelJoin, allLabs, resetAccount, updateUserData, error: contextError } = useLaboratory();
  
  // Calculate view based on role, but allow local override if user wants to switch
  const [localView, setLocalView] = useState<'choice' | 'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [justApplied, setJustApplied] = useState(false);
  const [labInviteCode, setLabInviteCode] = useState('');

  const activeView = useMemo(() => {
    // 1. If we are in the middle of a signup/apply process, show waiting
    if (userData?.status === 'looking' || justApplied) return 'waiting';
    if (userData?.status === 'pending') return 'waiting_approval';
    
    // 2. If Firestore already has a role, that's our definitive view
    const dbRole = userData?.role;
    if (dbRole === 'owner') return 'create';
    if (dbRole === 'technician') return 'join';

    // 3. Fallback to a local override only if Firestore hasn't set a role yet
    if (localView) return localView;

    // 4. Fallback to localStorage for fresh logins or unfinished sessions
    const sessionRole = localStorage.getItem('preferred_role');
    if (sessionRole === 'owner') return 'create';
    if (sessionRole === 'technician') return 'join';
    
    return 'choice';
  }, [localView, userData?.role, userData?.status, justApplied]);

  const [labName, setLabName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLabs = useMemo(() => {
    return allLabs.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allLabs, searchTerm]);

  const titleText = useMemo(() => {
    if (activeView === 'create') return <>Prepare seu <br/><span className="italic font-light">Atelier Especializado</span></>;
    if (activeView === 'join') return <>Crie seu <br/><span className="italic font-light">Perfil de Especialista</span></>;
    return <>Como deseja <br/><span className="italic font-light">expressar sua arte?</span></>;
  }, [activeView]);

  const sublineText = useMemo(() => {
    if (activeView === 'create') return "Rossana, agora é o momento de dar vida à sua marca e gerir sua excelência.";
    if (activeView === 'join') return "Cadastre-se como colaborador e fique visível para laboratórios que buscam seu talento.";
    return "Rossana, preparamos uma jornada singular. Escolha se deseja liderar sua própria equipe ou somar talentos.";
  }, [activeView]);

  // Sync context errors to local state
  useEffect(() => {
    if (contextError) setError(contextError);
  }, [contextError]);

  // Remove the useEffect that was redundant and potentially causing flickers
  /* 
  useEffect(() => {
    if (userData?.role && !localView) {
      if (userData.role === 'owner') setLocalView('create');
      else setLocalView('join');
    }
  }, [userData?.role]);
  */

  const showWaitingProfile = activeView === 'waiting';
  const showWaitingApproval = activeView === 'waiting_approval';
  const showLoadingProfile = !!(userData?.role && activeView === 'choice' && userData?.status === 'none');

  return (
    <div className="min-h-screen bg-brand-beige flex items-center justify-center p-8 relative overflow-hidden">
      {/* Refined Background Decor */}
      <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-brand-salmon/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-brand-sand/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
      
      <AnimatePresence mode="wait">
        {showWaitingProfile ? (
          <motion.div 
            key="waiting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full bg-white/80 backdrop-blur-2xl rounded-[3rem] p-12 text-center shadow-2xl relative z-10 border border-white"
          >
            <div className="w-20 h-20 bg-brand-salmon/10 rounded-3xl flex items-center justify-center text-brand-salmon mx-auto mb-8 border border-brand-salmon/20">
              <Clock size={32} className="animate-pulse" />
            </div>
            <h2 className="text-4xl font-serif text-brand-deep mb-2">Aguardando <span className="italic font-light">Vínculo</span></h2>
            <p className="text-[10px] font-bold tracking-[0.3em] text-brand-salmon uppercase mb-10">Conexão em Tempo Real</p>
            
            <div className="p-8 bg-brand-beige/50 rounded-[2.5rem] border border-white shadow-inner mb-8">
              <p className="text-xs font-medium text-neutral-500 leading-relaxed mb-6">
                Seu perfil está visível na rede. Compartilhe seu código com seu líder:
              </p>
              <div className="bg-white rounded-2xl p-8 border border-brand-salmon/10 shadow-sm group">
                <div className="text-5xl font-mono font-black tracking-[0.2em] text-brand-deep">
                  {userData?.accessCode || "..."}
                </div>
                <button 
                  onClick={() => {
                    if (userData?.accessCode) {
                      navigator.clipboard.writeText(userData.accessCode);
                      alert('Código copiado!');
                    }
                  }}
                  className="mt-6 w-full py-3 bg-brand-salmon text-white text-[9px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-brand-deep transition-all shadow-lg shadow-brand-salmon/20"
                >
                  Copiar Código
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={resetAccount}
                className="w-full py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-salmon transition-colors"
              >
                Cancelar Inscrição
              </button>
            </div>
          </motion.div>
        ) : showWaitingApproval ? (
          <motion.div 
            key="approval"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-md w-full bg-white/80 backdrop-blur-2xl rounded-[3rem] p-12 text-center shadow-2xl relative z-10 border border-white"
          >
            <div className="w-20 h-20 bg-brand-salmon/10 rounded-full flex items-center justify-center text-brand-salmon mx-auto mb-8">
              <Sparkles size={32} className="animate-pulse" />
            </div>
            <h2 className="text-3xl font-serif text-brand-deep mb-2 italic font-light">Solicitação Enviada</h2>
            <p className="text-[10px] font-bold tracking-[0.3em] text-neutral-400 uppercase mb-8">Status: Pendente</p>
            <div className="p-6 bg-brand-beige/50 rounded-3xl border border-white text-xs text-neutral-500 leading-relaxed italic">
              Aguardando o aceite do laboratório <br/>
              <span className="text-brand-deep font-bold not-italic">"{allLabs.find(l => l.id === userData?.labId)?.name || '...'}"</span>
            </div>
            <button onClick={cancelJoin} className="mt-10 px-8 py-3 border border-brand-salmon/20 rounded-full text-[9px] font-bold text-brand-salmon uppercase tracking-widest hover:bg-brand-salmon hover:text-white transition-all">
              Mudar de ideia
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl w-full relative z-10"
          >
            <div className="text-center mb-16 md:mb-24">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3 px-6 py-2 bg-white border border-brand-salmon/20 rounded-full text-brand-salmon text-[10px] font-bold uppercase tracking-[0.2em] mb-10 shadow-sm"
              >
                <div className="w-1.5 h-1.5 bg-brand-salmon rounded-full animate-ping" />
                Início da Jornada
              </motion.div>
              <h1 className="text-5xl md:text-8xl font-serif text-brand-deep leading-[0.9] tracking-tight">
                {titleText}
              </h1>
              <p className="text-neutral-500 text-xs md:text-sm font-medium mt-10 max-w-lg mx-auto leading-relaxed border-l border-brand-salmon/30 pl-8 text-left md:text-center md:border-l-0 md:pl-0">
                {sublineText}
              </p>
            </div>

            {activeView === 'choice' && (
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
                {/* Lider Role */}
                <motion.button
                  whileHover={{ y: -12, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setError(null);
                    setLocalView('create');
                    localStorage.setItem('preferred_role', 'owner');
                    try { await updateUserData({ role: 'owner' }); } catch (err) { setLocalView('choice'); }
                  }}
                  className="group bg-white p-10 md:p-16 rounded-[4rem] shadow-2xl text-left border border-white hover:border-brand-salmon/30 transition-all flex flex-col items-start relative overflow-hidden h-[400px] md:h-[500px]"
                >
                  <div className="w-16 h-16 bg-brand-deep text-white rounded-3xl flex items-center justify-center mb-12 shadow-xl group-hover:bg-brand-salmon transition-colors">
                    <Building2 size={32} />
                  </div>
                  <h3 className="text-3xl md:text-5xl font-serif text-brand-deep mb-6 italic">Sou <span className="font-bold not-italic">Líder</span></h3>
                  <p className="text-neutral-400 text-xs md:text-sm leading-relaxed max-w-[240px]">
                    Gerencie seu próprio laboratório, centralize pedidos e lidere sua equipe no topo do mercado.
                  </p>
                  <div className="mt-auto flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-salmon">
                    <span>Novo Atelier</span>
                    <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-salmon/5 rounded-full blur-2xl group-hover:bg-brand-salmon/10 transition-all" />
                </motion.button>

                {/* Equipe Role */}
                <motion.button
                  whileHover={{ y: -12, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setError(null);
                    setLocalView('join');
                    localStorage.setItem('preferred_role', 'technician');
                    try { await updateUserData({ role: 'technician' }); } catch (err) { setLocalView('choice'); }
                  }}
                  className="group bg-white p-10 md:p-16 rounded-[4rem] shadow-2xl text-left border border-white hover:border-brand-salmon/30 transition-all flex flex-col items-start relative overflow-hidden h-[400px] md:h-[500px]"
                >
                  <div className="w-16 h-16 bg-brand-beige border border-brand-salmon/20 text-brand-salmon rounded-3xl flex items-center justify-center mb-12 shadow-sm group-hover:bg-brand-salmon group-hover:text-white transition-all">
                    <Users size={32} />
                  </div>
                  <h3 className="text-3xl md:text-5xl font-serif text-brand-deep mb-6 italic">Sou <span className="font-bold not-italic">Equipe</span></h3>
                  <p className="text-neutral-400 text-xs md:text-sm leading-relaxed max-w-[240px]">
                    Cadastre-se para ser encontrado por laboratórios ou vincule-se usando o convite do seu patrão.
                  </p>
                  <div className="mt-auto flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-salmon">
                    <span>Colaboração</span>
                    <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-sand/5 rounded-full blur-2xl group-hover:bg-brand-sand/10 transition-all" />
                </motion.button>

                <div className="md:col-span-2 flex justify-center mt-8">
                  <button onClick={() => auth.signOut()} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-neutral-300 hover:text-brand-salmon transition-all">
                    <LogOut size={14} /> Sair da conta
                  </button>
                </div>
              </div>
            )}

            {activeView === 'create' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto bg-white/90 backdrop-blur-2xl rounded-[4rem] p-12 md:p-20 shadow-2xl border border-white relative overflow-hidden">
                <button onClick={() => { setLocalView('choice'); setError(null); }} className="mb-12 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-deep flex items-center gap-3 group">
                   <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-2 transition-transform" />
                   Voltar
                </button>
                <div className="mb-10">
                  <h2 className="text-4xl md:text-5xl font-serif text-brand-deep mb-4 italic">Identidade <span className="font-bold not-italic">do Lab</span></h2>
                  <p className="text-neutral-500 text-sm leading-relaxed">Qual será o nome do seu novo espaço de excelência?</p>
                </div>

                {error && <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-[10px] font-bold uppercase tracking-widest">{error}</div>}

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-2">Nome Comercial</label>
                    <input 
                      type="text" 
                      value={labName}
                      onChange={(e) => setLabName(e.target.value)}
                      placeholder="Ex: Diamond Dental Lab"
                      className="w-full px-8 py-5 bg-brand-beige/50 border border-transparent rounded-[2.5rem] focus:bg-white focus:border-brand-salmon/30 outline-none transition-all text-lg font-medium"
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      if (!labName.trim()) return;
                      setLoading(true);
                      try { await createLab(labName.trim()); } catch (err: any) { setError(err.message); } finally { setLoading(false); }
                    }}
                    disabled={loading}
                    className="w-full py-6 bg-brand-deep text-white font-bold text-xs uppercase tracking-[0.3em] rounded-[2.5rem] hover:bg-brand-salmon transition-all shadow-xl shadow-brand-deep/20 disabled:opacity-50"
                  >
                    {loading ? 'Preparando Atelier...' : 'Fundar Laboratório'}
                  </button>
                  <button onClick={resetAccount} className="w-full py-3 text-[9px] font-bold uppercase tracking-widest text-rose-300 hover:text-rose-500 transition-colors">Zerar conta</button>
                </div>
              </motion.div>
            )}

            {activeView === 'join' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto bg-white/90 backdrop-blur-2xl rounded-[4rem] p-12 md:p-20 shadow-2xl border border-white">
                <button onClick={() => { setLocalView('choice'); setError(null); }} className="mb-12 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-deep flex items-center gap-3 group">
                   <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-2 transition-transform" />
                   Voltar
                </button>
                
                <div className="mb-10">
                  <h2 className="text-4xl md:text-5xl font-serif text-brand-deep mb-4 italic">Seu <span className="font-bold not-italic">Perfil</span></h2>
                  <p className="text-neutral-500 text-sm leading-relaxed">Ative seu perfil para que laboratórios possam te encontrar.</p>
                </div>

                {error && <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-[10px] font-bold uppercase tracking-widest">{error}</div>}

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-2">Nome Profissional</label>
                    <input 
                      type="text" 
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="Nome Completo"
                      className="w-full px-8 py-5 bg-brand-beige/50 border border-transparent rounded-[2.5rem] focus:bg-white focus:border-brand-salmon/30 outline-none transition-all text-lg font-medium"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={async () => {
                        if (!candidateName.trim()) return;
                        setLoading(true);
                        try { await becomeCandidate(candidateName.trim()); } catch (err: any) { setError(err.message); } finally { setLoading(false); }
                      }}
                      disabled={loading}
                      className="w-full py-6 bg-brand-deep text-white font-bold text-xs uppercase tracking-[0.3em] rounded-[2.5rem] hover:bg-brand-salmon transition-all shadow-xl shadow-brand-deep/20 disabled:opacity-50"
                    >
                      {loading ? 'Sinalizando...' : 'Ativar meu Perfil'}
                    </button>

                    <div className="relative py-6">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-100" /></div>
                      <div className="relative flex justify-center"><span className="px-4 bg-white text-[9px] font-bold text-neutral-300 uppercase tracking-[0.3em]">Ou Vincule Direto</span></div>
                    </div>

                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={labInviteCode}
                        onChange={(e) => setLabInviteCode(e.target.value.toUpperCase())}
                        placeholder="CÓDIGO EMPRESA"
                        maxLength={6}
                        className="flex-1 px-6 py-4 bg-brand-beige/50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-salmon/20 outline-none transition-all text-sm font-mono font-bold tracking-[0.3em]"
                      />
                      <button 
                        onClick={async () => {
                          if (labInviteCode.length < 6) return;
                          setLoading(true);
                          try { await joinLabByInviteCode(labInviteCode); } catch (err: any) { setError(err.message); } finally { setLoading(false); }
                        }}
                        disabled={loading || labInviteCode.length < 6}
                        className="px-6 bg-brand-salmon text-white rounded-2xl hover:bg-brand-deep transition-all shadow-lg shadow-brand-salmon/20"
                      >
                        <ArrowRight size={20} />
                      </button>
                    </div>
                    <p className="text-[9px] text-neutral-400 text-center font-medium">Use o código de 6 dígitos que seu líder te enviou.</p>
                  </div>

                  <button onClick={resetAccount} className="w-full text-[9px] font-bold uppercase tracking-widest text-rose-300 hover:text-rose-500 transition-colors pt-4">Zerar Conta</button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F5F2EF; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #C08497; }
      `}</style>
    </div>
  );
}
