import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Save, Sparkles } from 'lucide-react';
import { useLaboratory } from '../context/LaboratoryContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { userData, updateUserData } = useLaboratory();
  const [name, setName] = useState(userData?.displayName || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await updateUserData({ displayName: name.trim() });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-deep/20 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full -mr-16 -mt-16" />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-neutral-300 hover:text-brand-deep hover:bg-neutral-50 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-brand-accent/10 text-brand-accent rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <User size={40} />
              </div>
              <h2 className="text-3xl font-serif text-brand-deep">Editar Perfil</h2>
              <p className="text-neutral-400 text-xs mt-2 uppercase tracking-[0.2em] font-black">Personalize sua Identidade</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Seu Nome Visual</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como deseja ser chamada?"
                    className="w-full pl-12 pr-5 py-4 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-accent/20 outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSave}
                  disabled={loading || !name.trim()}
                  className="w-full py-4 bg-brand-deep text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-accent hover:shadow-xl hover:shadow-brand-accent/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : (
                    <>
                      <Save size={16} />
                      Atualizar Perfil
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-50 text-center">
              <p className="text-[10px] text-neutral-300 font-medium italic">Sua essência é o nosso maior diferencial.</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
