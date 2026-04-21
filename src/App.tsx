import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  ClipboardList, 
  Users, 
  Settings, 
  DollarSign, 
  Package, 
  Menu,
  X,
  Plus,
  Search,
  LogOut,
  UserCircle,
  AlertCircle,
  Sparkles,
  Heart,
  Wallet,
  Home,
  Building2,
  ArrowRight
} from 'lucide-react';
import { cn } from './lib/utils';
import Logo from './components/Logo';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './lib/firebase';
import { useLaboratory } from './context/LaboratoryContext';

// Lazy load pages
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const OrdersPage = React.lazy(() => import('./pages/OrdersPage'));
const ClientsPage = React.lazy(() => import('./pages/ClientsPage'));
const ConfigPage = React.lazy(() => import('./pages/ConfigPage'));
const FinancialPage = React.lazy(() => import('./pages/FinancialPage'));
const TeamPage = React.lazy(() => import('./pages/TeamPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const OnboardingScreen = React.lazy(() => import('./components/OnboardingScreen'));
const OrderModal = React.lazy(() => import('./components/OrderModal'));
const ProfileModal = React.lazy(() => import('./components/ProfileModal'));

type PageId = 'dashboard' | 'orders' | 'clients' | 'config' | 'financial' | 'team';

export default function App() {
  const [user, loadingAuth] = useAuthState(auth);
  const { 
    userData, 
    loading: loadingLab, 
    activePage, 
    setActivePage, 
    error: labError, 
    showWelcome, 
    setShowWelcome,
    labId,
    isOwner 
  } = useLaboratory();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const isIframe = window.self !== window.top;

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Painel', icon: Home, show: true },
    { id: 'orders', label: 'Produção', icon: ClipboardList, show: !!labId },
    { id: 'financial', label: 'Finanças', icon: DollarSign, show: isOwner },
    { id: 'clients', label: 'Portfólio', icon: Heart, show: isOwner },
    { id: 'team', label: 'Equipe', icon: Users, show: !!labId },
    { id: 'config', label: 'Ajustes', icon: Settings, show: true },
  ] as const;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let timer: any;
    if (loadingAuth || (user && loadingLab)) {
      timer = setTimeout(() => setShowSlowMessage(true), 10000);
    } else {
      setShowSlowMessage(false);
    }
    return () => clearTimeout(timer);
  }, [loadingAuth, loadingLab, user]);

  const CurrentPage = useMemo(() => {
    switch (activePage) {
      case 'dashboard': return DashboardPage;
      case 'orders': return OrdersPage;
      case 'clients': return ClientsPage;
      case 'config': return ConfigPage;
      case 'financial': return FinancialPage;
      case 'team': return TeamPage;
      default: return null;
    }
  }, [activePage]);

  if (loadingAuth || (user && loadingLab)) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-beige p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent mb-6"></div>
        <AnimatePresence>
          {showSlowMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="text-brand-accent text-[10px] font-black uppercase tracking-widest animate-pulse">A conexão está um pouco lenta...</p>
              <p className="text-[9px] text-neutral-400 max-w-xs mx-auto leading-relaxed">Dica: Se você for deslogado ao fechar a página, tente abrir o app em uma <span className="text-brand-deep font-bold">Nova Aba</span> para garantir a persistência.</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-white rounded-full text-[9px] font-black uppercase tracking-widest text-neutral-400 border border-neutral-100 hover:text-brand-deep hover:border-brand-accent/20 transition-all"
              >
                Recarregar agora
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!user) {
    return (
      <React.Suspense fallback={
        <div className="h-screen w-full flex items-center justify-center bg-brand-beige">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        </div>
      }>
        <LoginPage />
      </React.Suspense>
    );
  }

  // If user is not approved or hasn't picked a lab, show onboarding
  if (userData?.status !== 'approved') {
    return (
      <React.Suspense fallback={
        <div className="h-screen w-full flex items-center justify-center bg-brand-beige">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        </div>
      }>
        <OnboardingScreen />
      </React.Suspense>
    );
  }

  return (
    <React.Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-brand-beige">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-salmon"></div>
      </div>
    }>
      <div className="flex h-screen bg-brand-beige overflow-hidden font-sans text-brand-deep">
        {/* Navigation Sidebar */}
        <aside className={cn(
          "bg-white h-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] fixed md:relative z-[100] border-r border-[#F5F2EF] shadow-2xl md:shadow-none",
          isSidebarOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full md:w-28 md:translate-x-0"
        )}>
          <div className="flex flex-col h-full py-10 px-6">
            <div className="flex items-center justify-center mb-16 relative">
              <Logo className="w-16 h-16 transform rotate-3" variant="icon" />
              {isSidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-4 flex flex-col"
                >
                  <span className="text-xl font-serif font-black tracking-tight leading-none text-brand-deep italic">Rossana</span>
                  <span className="text-[10px] font-black text-brand-salmon uppercase tracking-[0.2em]">Freitas Lab</span>
                </motion.div>
              )}
            </div>

            <nav className="flex-1 space-y-3">
              {NAV_ITEMS.map((item) => item.show && (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center transition-all duration-500 rounded-[1.5rem] group relative overflow-hidden",
                    activePage === item.id 
                      ? "bg-brand-deep text-white p-4 shadow-2xl shadow-brand-deep/30" 
                      : "p-4 text-neutral-300 hover:text-brand-salmon hover:bg-brand-beige/30"
                  )}
                >
                  <item.icon size={isSidebarOpen ? 20 : 26} className={cn("transition-transform group-hover:scale-110", !isSidebarOpen && "mx-auto")} />
                  {isSidebarOpen && (
                    <span className="ml-4 text-[10px] font-black uppercase tracking-[0.1em]">{item.label}</span>
                  )}
                  {activePage === item.id && isSidebarOpen && (
                    <motion.div layoutId="nav-pill" className="absolute left-0 w-1 h-6 bg-brand-salmon rounded-full ml-1" />
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-6 space-y-4">
               <div className="h-px bg-neutral-100 mx-2" />
               <button 
                onClick={() => auth.signOut()}
                className={cn(
                  "w-full flex items-center p-4 text-neutral-300 hover:text-rose-400 hover:bg-rose-50 transition-all rounded-3xl group",
                  !isSidebarOpen && "justify-center"
                )}
               >
                 <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                 {isSidebarOpen && <span className="ml-4 text-xs font-black uppercase tracking-widest">Sair</span>}
               </button>
            </div>
          </div>
        </aside>

        {/* Workspace Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-brand-beige overflow-hidden">
          {/* Superior Header */}
          <header className={`h-24 px-8 md:px-14 flex items-center justify-between ${isIframe ? 'bg-rose-50/50' : 'bg-transparent'} flex-shrink-0 transition-colors`}>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-3 bg-white text-brand-salmon rounded-2xl shadow-xl shadow-brand-salmon/5 hover:scale-110 active:scale-95 transition-all border border-brand-salmon/5"
              >
                <Menu size={22} />
              </button>
              <div className="hidden lg:flex flex-col">
                <h1 className="text-[9px] font-black text-brand-salmon uppercase tracking-[0.3em] mb-1">Central de Comando</h1>
                <h2 className="text-sm font-bold text-brand-deep uppercase tracking-widest">{NAV_ITEMS.find(n => n.id === activePage)?.label}</h2>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {isIframe && (
                <div className="hidden xl:flex items-center gap-2 px-4 py-2 bg-rose-100/50 rounded-full border border-rose-200">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest leading-none">Modo Visualização</span>
                </div>
              )}
              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-serif italic text-brand-deep font-bold leading-none">{userData?.displayName || 'Perfil'}</span>
                  <span className="text-[8px] font-black text-brand-salmon uppercase tracking-[0.2em] mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">Ver Ajustes</span>
                </div>
                <div className="w-12 h-12 bg-white border border-brand-salmon/10 p-1 rounded-2xl shadow-lg flex items-center justify-center transform rotate-3 group-hover:rotate-0 transition-transform">
                   <div className="w-full h-full bg-brand-beige rounded-xl flex items-center justify-center font-serif font-black text-brand-salmon uppercase">
                     {userData?.displayName?.charAt(0) || 'U'}
                   </div>
                </div>
              </div>
            </div>
          </header>

          {/* Dynamic Content */}
          <div className="flex-1 overflow-y-auto px-6 md:px-14 pb-20 custom-scrollbar scroll-smooth">
            <div className="max-w-[1400px] mx-auto py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                >
                  {activePage === 'dashboard' && <DashboardPage />}
                  {activePage === 'orders' && <OrdersPage />}
                  {activePage === 'financial' && <FinancialPage />}
                  {activePage === 'clients' && <ClientsPage />}
                  {activePage === 'team' && <TeamPage />}
                  {activePage === 'config' && <ConfigPage />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          
          {/* Quick Access Mobile Nav */}
          <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-brand-deep/90 backdrop-blur-xl p-2 rounded-[2.5rem] md:hidden shadow-2xl z-[1000] border border-white/10">
            {NAV_ITEMS.slice(0, 5).map(item => item.show && (
              <button 
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                  activePage === item.id ? "bg-brand-salmon text-white" : "text-neutral-400"
                )}
              >
                <item.icon size={18} />
              </button>
            ))}
          </nav>
        </main>

        {/* Global Modals */}
        <OrderModal 
          isOpen={isOrderModalOpen} 
          onClose={() => setIsOrderModalOpen(false)} 
          onSuccess={() => {
            setIsOrderModalOpen(false);
            setActivePage('orders');
          }}
        />

        <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />

        <AnimatePresence>
          {showWelcome && (
            <div className="fixed inset-0 z-[2100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowWelcome(false)}
                className="absolute inset-0 bg-brand-deep/80 backdrop-blur-xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[4rem] p-12 max-w-xl w-full text-center relative z-10 shadow-2xl border border-white"
              >
                <div className="w-24 h-24 bg-brand-salmon rounded-[2rem] flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-brand-salmon/20">
                  <Sparkles size={48} className="animate-pulse" />
                </div>
                <h2 className="text-4xl font-serif text-brand-deep mb-4 italic font-light tracking-tight">Percurso <span className="font-bold not-italic font-serif">Iniciado</span></h2>
                <p className="text-neutral-500 text-sm font-medium leading-relaxed mb-10">
                  Seu perfil foi conectado com sucesso ao laboratório. Sincronização em tempo real ativada para toda a equipe.
                </p>
                <button 
                  onClick={() => setShowWelcome(false)}
                  className="w-full py-5 bg-brand-deep text-white font-black text-xs tracking-[0.2em] uppercase rounded-full shadow-xl transition-all"
                >
                  Acessar Atelier
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </React.Suspense>
  );
}
