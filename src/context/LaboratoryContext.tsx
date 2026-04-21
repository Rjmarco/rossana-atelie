import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot, setDoc, collection, serverTimestamp, query, where, getDocs, updateDoc, writeBatch, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserData {
  uid: string;
  email: string;
  labId: string | null;
  role: 'owner' | 'technician' | 'secretary' | 'assistant' | null;
  status: 'approved' | 'pending' | 'none' | 'looking';
  displayName?: string;
  accessCode?: string;
  linkedAt?: any;
  updatedAt?: any;
  createdAt?: any;
}

interface LaboratoryContextType {
  userData: UserData | null;
  labId: string | null;
  loading: boolean;
  error: string | null;
  activePage: string;
  setActivePage: (page: any) => void;
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
  createLab: (name: string) => Promise<void>;
  joinLab: (labId: string) => Promise<void>; 
  joinLabByInviteCode: (code: string) => Promise<void>;
  becomeCandidate: (name: string) => Promise<void>;
  hireCollaborator: (collaboratorUid: string, role: string) => Promise<void>;
  linkByCode: (code: string, role: string) => Promise<void>;
  cancelJoin: () => Promise<void>;
  resetAccount: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  allLabs: { id: string; name: string; inviteCode?: string }[];
  candidates: UserData[];
  generateNewCode: () => string;
  isOwner: boolean;
}

const LaboratoryContext = createContext<LaboratoryContextType>({
  userData: null,
  labId: null,
  loading: true,
  error: null,
  activePage: 'dashboard',
  setActivePage: () => {},
  showWelcome: false,
  setShowWelcome: () => {},
  createLab: async () => {},
  joinLab: async () => {},
  becomeCandidate: async () => {},
  hireCollaborator: async () => {},
  linkByCode: async () => {},
  cancelJoin: async () => {},
  allLabs: [],
  candidates: [],
  generateNewCode: () => '',
  isOwner: false,
});

export function LaboratoryProvider({ children }: { children: React.ReactNode }) {
  const [user, loadingAuth] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Load initial page from localStorage or default to dashboard
  const [activePage, setActivePageState] = useState(() => {
    return localStorage.getItem('last_active_page') || 'dashboard';
  });

  const setActivePage = useCallback((page: string) => {
    setActivePageState(page);
    localStorage.setItem('last_active_page', page);
  }, []);
  const [showWelcome, setShowWelcome] = useState(false);
  const [allLabs, setAllLabs] = useState<{ id: string; name: string }[]>([]);
  const [candidates, setCandidates] = useState<UserData[]>([]);

  const generateNewCode = () => {
    // 6-digit numeric code for "faster" feel and easier sharing
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Only listen to labs if user is signed in
  useEffect(() => {
    if (!user) {
      setAllLabs([]);
      return;
    }
    const q = collection(db, 'laboratories');
    const unsubLabs = onSnapshot(q, (snap) => {
      setAllLabs(snap.docs.map(d => ({ 
        id: d.id, 
        name: d.data().name,
        inviteCode: d.data().inviteCode
      })));
    }, (err) => {
      console.error("Labs listener error:", err);
    });
    return () => unsubLabs();
  }, [user, userData?.status]);

  // Monitor candidates
  useEffect(() => {
    if (!user) {
      setCandidates([]);
      return;
    }
    // We listen to candidates to facilitate browsing, 
    // but the UI will only show them to owners.
    const q = query(collection(db, 'users'), where('status', '==', 'looking'));
    const unsub = onSnapshot(q, (snap) => {
      setCandidates(snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserData)));
    }, (err) => {
      console.error("Candidate listener error:", err);
    });
    return () => unsub();
  }, [user]);

  // Presence logic
  useEffect(() => {
    if (!user || userData?.status !== 'approved') return;
    const userRef = doc(db, 'users', user.uid);
    
    // Set active status
    updateDoc(userRef, { active: true, lastActive: serverTimestamp() }).catch(() => {});
    
    return () => {
      // Transition to inactive on unmount
      updateDoc(userRef, { active: false, lastActive: serverTimestamp() }).catch(() => {});
    };
  }, [user?.uid, userData?.status]);

  // User profile listener
  useEffect(() => {
    let unsubscribe: () => void;
    
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      setLoading(true);
      
      unsubscribe = onSnapshot(userRef, async (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserData;
          
          // Self-healing: Ensure Owners are always linked to their lab if they lost the connection
          if ((data.status === 'none' || !data.labId || data.role !== 'owner') && user.uid) {
             const labsQuery = query(collection(db, 'laboratories'), where('ownerId', '==', user.uid), limit(1));
             const labSnap = await getDocs(labsQuery);
             if (!labSnap.empty) {
               const foundLab = labSnap.docs[0];
               await updateDoc(userRef, {
                 labId: foundLab.id,
                 role: 'owner',
                 status: 'approved'
               });
               // snapshot will re-fire
               return;
             }
          }

          if (data.status === 'approved' && userData?.status && userData.status !== 'approved') {
            setShowWelcome(true);
          }

          setUserData(data);

          // Background fix for missing accessCode (Specialist)
          if (!data.accessCode) {
            const newCode = generateNewCode();
            updateDoc(userRef, { accessCode: newCode }).catch(() => {});
          }

          // Background fix for missing inviteCode for Owners
          if (data.role === 'owner' && data.labId) {
            const lQuery = query(collection(db, 'laboratories'), where('ownerId', '==', user.uid), limit(1));
            getDocs(lQuery).then(lSnap => {
               if (!lSnap.empty && !lSnap.docs[0].data().inviteCode) {
                  updateDoc(doc(db, 'laboratories', lSnap.docs[0].id), { inviteCode: generateNewCode() }).catch(() => {});
               }
            }).catch(() => {});
          }
          setLoading(false);
        } else {
          // Initialize New User profile
          const newCode = generateNewCode();
          const storedRole = localStorage.getItem('preferred_role') as any;
          
          const initialData: UserData = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'Especialista',
            labId: null,
            role: (storedRole === 'owner' || storedRole === 'technician') ? storedRole : null,
            status: 'none',
            accessCode: newCode
          };
          
          // Check if user is a returning owner before creating a fresh "none" profile
          const labsQuery = query(collection(db, 'laboratories'), where('ownerId', '==', user.uid), limit(1));
          const labSnap = await getDocs(labsQuery);
          
          if (!labSnap.empty) {
            const labDoc = labSnap.docs[0];
            const recoveredData = {
              ...initialData,
              labId: labDoc.id,
              role: 'owner' as const,
              status: 'approved' as const
            };
            await setDoc(userRef, { ...recoveredData, createdAt: serverTimestamp() });
          } else {
            await setDoc(userRef, { ...initialData, createdAt: serverTimestamp() });
          }
        }
      }, (err) => {
        console.error("User listener error:", err);
        setError("Erro de conexão. Tente recarregar.");
        setLoading(false);
      });
    } else {
      setUserData(null);
      setLoading(loadingAuth);
    }
    
    return () => unsubscribe?.();
  }, [user, loadingAuth]);

  const createLab = async (name: string) => {
    if (!user) return;
    try {
      // Optimistic update
      const labId = 'temp-' + Math.random().toString(36).substring(7);
      const optimisticData: UserData = {
        ...userData!,
        labId,
        role: 'owner',
        status: 'approved',
        active: true
      };
      setUserData(optimisticData);

      const labInviteCode = generateNewCode();
      const labRef = doc(collection(db, 'laboratories'));
      
      const batch = writeBatch(db);
      batch.set(labRef, { 
        name, 
        ownerId: user.uid, 
        inviteCode: labInviteCode,
        createdAt: serverTimestamp() 
      });
      
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        uid: user.uid,
        email: user.email,
        displayName: userData?.displayName || user.displayName || user.email?.split('@')[0],
        labId: labRef.id,
        role: 'owner' as const,
        status: 'approved' as const,
        active: true,
        updatedAt: serverTimestamp()
      };
      batch.update(userRef, updateData);
      await batch.commit();
      localStorage.setItem('preferred_role', 'owner');
    } catch (err: any) {
      setError(err.message);
      // Revert optimism if failed
      setUserData(userData);
      throw err;
    }
  };

  const becomeCandidate = async (name: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const code = userData?.accessCode || generateNewCode();
      
      // Optimistic update
      setUserData(prev => prev ? {
        ...prev,
        displayName: name,
        status: 'looking',
        role: 'technician',
        accessCode: code
      } : null);

      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: name,
        status: 'looking',
        role: 'technician',
        accessCode: code,
        updatedAt: serverTimestamp()
      }, { merge: true });
      localStorage.setItem('preferred_role', 'technician');
    } catch (err: any) {
      setError(err.message);
      console.error("BecomeCandidate error:", err);
      // Revert if error
      setUserData(userData);
      throw err;
    }
  };

  const hireCollaborator = async (collaboratorUid: string, role: string) => {
    if (!user || userData?.role !== 'owner' || !userData.labId) return;
    try {
      const p = setDoc(doc(db, 'users', collaboratorUid), {
        labId: userData.labId,
        role: role,
        status: 'approved',
        linkedAt: serverTimestamp()
      }, { merge: true });
      
      const t = new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), 10000));
      await Promise.race([p, t]).catch(err => {
        if (err.message !== 'TIMEOUT') throw err;
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const linkByCode = async (inputCode: string, role: string) => {
    if (!user || userData?.role !== 'owner' || !userData.labId) return;
    const code = inputCode.trim().toUpperCase();
    if (!code) return;

    try {
      // First try string match
      let q = query(collection(db, 'users'), where('accessCode', '==', code));
      let snap = await getDocs(q);
      
      // If no result and purely numeric, try numeric match as fallback for legacy data
      if (snap.empty && /^\d+$/.test(code)) {
        q = query(collection(db, 'users'), where('accessCode', '==', parseInt(code, 10)));
        snap = await getDocs(q);
      }
      
      if (snap.empty) {
        throw new Error('Código inválido ou especialista não encontrado.');
      }

      const targetUser = snap.docs[0];
      const targetData = targetUser.data();

      // Ensure we don't link someone already in a lab unless they are looking or it's a reset
      if (targetData.labId && targetData.status === 'approved' && targetData.labId !== userData.labId) {
        throw new Error('Este especialista já faz parte de outra equipe.');
      }

      await setDoc(doc(db, 'users', targetUser.id), {
        labId: userData.labId,
        role: role,
        status: 'approved',
        linkedAt: serverTimestamp()
      }, { merge: true });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const joinLab = async (labId: string) => {
    if (!user) return;
    try {
      // Optimistic update
      setUserData(prev => prev ? { ...prev, labId, status: 'pending', role: 'technician' } : null);
      
      await setDoc(doc(db, 'users', user.uid), {
        labId,
        status: 'pending',
        role: 'technician'
      }, { merge: true });
    } catch (err: any) {
      setError(err.message);
      setUserData(userData);
    }
  };

  const joinLabByInviteCode = async (inviteCode: string) => {
    if (!user) return;
    const code = inviteCode.trim().toUpperCase();
    if (!code) throw new Error('Insira o código do laboratório.');

    try {
      const q = query(collection(db, 'laboratories'), where('inviteCode', '==', code));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        throw new Error('Laboratório não encontrado com este código.');
      }

      const labDoc = snap.docs[0];
      const labId = labDoc.id;

      // Optimistic update
      setUserData(prev => prev ? { ...prev, labId, status: 'pending', role: 'technician' } : null);
      
      await setDoc(doc(db, 'users', user.uid), {
        labId,
        status: 'pending',
        role: 'technician'
      }, { merge: true });
    } catch (err: any) {
      setError(err.message);
      setUserData(userData);
      throw err;
    }
  };

  const cancelJoin = async () => {
    if (!user) return;
    try {
      setUserData(prev => prev ? { ...prev, labId: null, status: 'none' } : null);
      await setDoc(doc(db, 'users', user.uid), { labId: null, status: 'none' }, { merge: true });
      localStorage.removeItem('preferred_role');
    } catch (err: any) {
      setError(err.message);
      setUserData(userData);
    }
  };

  const resetAccount = async () => {
    if (!user) return;
    try {
      setUserData(prev => prev ? { ...prev, labId: null, status: 'none', role: null } : null);
      await setDoc(doc(db, 'users', user.uid), { labId: null, status: 'none', role: null }, { merge: true });
      localStorage.removeItem('preferred_role');
    } catch (err: any) {
      setError(err.message);
      setUserData(userData);
    }
  };

  const updateUserData = useCallback(async (data: Partial<UserData>) => {
    if (!userData?.uid) return;
    try {
      setUserData(prev => prev ? { ...prev, ...data } : null);
      await setDoc(doc(db, 'users', userData.uid), data, { merge: true });
    } catch (err: any) {
      setError(err.message);
      setUserData(userData);
    }
  }, [userData?.uid, userData]);

  const value = useMemo(() => ({
    userData,
    labId: userData?.status === 'approved' ? userData.labId : null,
    loading,
    error,
    activePage,
    setActivePage,
    showWelcome,
    setShowWelcome,
    createLab,
    joinLab,
    joinLabByInviteCode,
    becomeCandidate,
    hireCollaborator,
    linkByCode,
    cancelJoin,
    resetAccount,
    updateUserData,
    allLabs,
    candidates,
    generateNewCode,
    isOwner: userData?.role === 'owner'
  }), [userData, loading, error, activePage, showWelcome, updateUserData, allLabs, candidates]);

  return (
    <LaboratoryContext.Provider value={value}>
      {children}
    </LaboratoryContext.Provider>
  );
}

export const useLaboratory = () => useContext(LaboratoryContext);
