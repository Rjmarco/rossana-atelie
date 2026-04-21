import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogIn, 
  UserPlus, 
  Stethoscope, 
  User,
  ArrowRight, 
  Lock, 
  Mail,
  Building2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { 
  doc, 
  getDoc,
  setDoc, 
  collection, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { cn } from '../lib/utils';
import Logo from '../components/Logo';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!isLogin && !name.trim()) {
      setError('Por favor, informe seu nome.');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um e-mail válido.');
      return false;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }

    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        // Note: userData initialization is now handled in LaboratoryContext listener
      }
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        const proj = auth.app.options.projectId;
        setError(`Domínio não autorizado para o projeto "${proj}". Adicione "${window.location.hostname}" no Console do Firebase em Authentication -> Settings.`);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Note: Data fetching and initialization handled by LaboratoryContext
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request') return;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-beige flex items-center justify-center p-4 md:p-10 relative overflow-hidden font-sans">
      {/* Decorative Elite Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-salmon/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-deep/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-6xl h-full md:h-[min(800px,90vh)] bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(45,39,36,0.1)] overflow-hidden flex flex-col md:flex-row relative z-10 border border-white"
      >
        {/* Visual Experience Side */}
        <div className="hidden md:flex w-[45%] bg-brand-deep p-16 flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/dental/1200/800')] bg-cover bg-center mix-blend-overlay group-hover:scale-110 transition-transform duration-[10s]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-deep via-brand-deep/80 to-brand-salmon/20" />
          
          <div className="relative z-10">
            <Logo className="w-32 h-32 mb-12" />
            
            <h1 className="text-5xl lg:text-6xl font-serif text-white italic leading-tight font-light tracking-tight mb-8">
              Rossana <br/><span className="font-bold not-italic font-serif">Freitas Lab</span>
            </h1>
            
            <p className="text-white/40 text-sm font-medium leading-relaxed max-w-xs tracking-wide">
              A excelência na gestão laboratorial traduzida em uma experiência sublime. Sua arte, sob nossa regência tecnológica.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-6">
            <div className="h-10 w-px bg-brand-salmon/30" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-salmon">EST. MMXXIV</span>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mt-1 italic">Protocolo de Elite</span>
            </div>
          </div>
        </div>

        {/* Access Form Side */}
        <div className="flex-1 p-8 md:p-16 lg:p-24 flex flex-col bg-white overflow-y-auto custom-scrollbar">
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-brand-salmon rounded-full" />
              <span className="text-[10px] font-black text-brand-salmon uppercase tracking-[0.4em] block">
                {isLogin ? 'Authentification' : 'Novo Registro'}
              </span>
            </div>
            <h2 className="text-4xl font-serif text-brand-deep leading-tight italic">
              Conecte-se ao <br/> <span className="font-bold not-italic font-serif">Seu Domínio</span>
            </h2>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Nome do Profissional</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-brand-salmon transition-colors" size={18} />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Identificação Profissional"
                      required={!isLogin}
                      className="w-full h-16 pl-16 pr-8 bg-brand-beige/20 border border-transparent rounded-3xl focus:bg-white focus:border-brand-salmon/20 outline-none transition-all text-sm font-bold placeholder:text-neutral-300"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Endereço de E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-brand-salmon transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail corporativo"
                  required
                  className="w-full h-16 pl-16 pr-8 bg-brand-beige/20 border border-transparent rounded-3xl focus:bg-white focus:border-brand-salmon/30 outline-none transition-all text-sm font-bold placeholder:text-neutral-300"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Sua Senha</label>
                {isLogin && <button type="button" className="text-[8px] font-black text-brand-salmon uppercase tracking-widest hover:underline">Esqueci a Senha</button>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-brand-salmon transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-16 pl-16 pr-8 bg-brand-beige/20 border border-transparent rounded-3xl focus:bg-white focus:border-brand-salmon/30 outline-none transition-all text-sm font-bold placeholder:text-neutral-300"
                />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-500 text-[10px] font-black uppercase tracking-widest relative">
                <AlertCircle size={16} />
                <span className="leading-tight">{error}</span>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 bg-brand-deep hover:bg-brand-salmon text-white font-black text-[11px] tracking-[0.3em] uppercase rounded-3xl shadow-2xl shadow-brand-deep/20 transition-all duration-500 flex items-center justify-center gap-4 group disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? 'Acessando Protocolo...' : (isLogin ? 'Entrar no Atelier' : 'Criar minha conta')}
              {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="relative my-12 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-beige"></div>
            </div>
            <span className="relative px-6 text-[9px] font-black uppercase tracking-[0.4em] text-neutral-300 bg-white">Ou acessar com</span>
          </div>

          <button 
            type="button"
            disabled={loading}
            onClick={signInWithGoogle}
            className="w-full h-16 bg-white border border-brand-beige rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] text-brand-deep hover:border-brand-salmon/20 hover:bg-brand-beige/10 transition-all duration-300 flex items-center justify-center gap-4 group disabled:opacity-50"
          >
            <div className="w-6 h-6 bg-white rounded-lg p-1 flex items-center justify-center shadow-sm">
              <img src="https://www.google.com/favicon.ico" className="w-full h-full" alt="Google" />
            </div>
            Identidade Google
          </button>

          <div className="mt-auto pt-12 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-[10px] font-black text-neutral-400 hover:text-brand-salmon uppercase tracking-[0.2em] transition-all group"
            >
              <span className="border-b-2 border-transparent group-hover:border-brand-salmon pb-1 transition-all">
                {isLogin ? 'Nova por aqui? Criar meu atelier' : 'Já possui acesso? Efetuar Login'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
