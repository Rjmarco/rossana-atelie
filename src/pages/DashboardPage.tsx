import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Trash2,
  X,
  Search,
  Calendar,
  BarChart3,
  ArrowRight,
  Sparkles,
  Plus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useLaboratory } from '../context/LaboratoryContext';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AnimatePresence } from 'motion/react';

export default function DashboardPage() {
  const { userData, labId, setActivePage } = useLaboratory();
  const [orders, setOrders] = useState<any[]>([]);
  const [upcomingOrders, setUpcomingOrders] = useState<any[]>([]);
  const [dentistsCount, setDentistsCount] = useState(0);
  const [dentists, setDentists] = useState<Record<string, string>>({});

  const chartData = React.useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        name: days[d.getDay()],
        dateStr: d.toISOString().split('T')[0],
        ordens: 0,
        faturamento: 0
      };
    });

    orders.forEach(order => {
      if (order.createdAt?.seconds) {
        const orderDate = new Date(order.createdAt.seconds * 1000).toISOString().split('T')[0];
        const dayMatch = last7Days.find(d => d.dateStr === orderDate);
        if (dayMatch) {
          dayMatch.ordens += 1;
          dayMatch.faturamento += order.total || 0;
        }
      }
    });

    return last7Days;
  }, [orders]);

  useEffect(() => {
    if (!labId) {
      setOrders([]);
      setUpcomingOrders([]);
      setDentistsCount(0);
      return;
    }

    const handleError = (err: any, source: string) => {
      console.error(`Dashboard listener error [${source}]:`, err);
    };

    // All orders
    const unsubscribeOrders = onSnapshot(collection(db, `laboratories/${labId}/orders`), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleError(err, 'orders'));

    // Upcoming orders (sorted by dueDate)
    const qUpcoming = query(
      collection(db, `laboratories/${labId}/orders`), 
      orderBy('dueDate', 'asc'),
      limit(10)
    );
    const unsubscribeUpcoming = onSnapshot(qUpcoming, (snap) => {
      setUpcomingOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleError(err, 'upcoming_orders'));

    const unsubscribeDentists = onSnapshot(collection(db, `laboratories/${labId}/dentists`), (snap) => {
      setDentistsCount(snap.size);
      const map: Record<string, string> = {};
      snap.forEach(d => { map[d.id] = d.data().name; });
      setDentists(map);
    }, (err) => handleError(err, 'dentists'));

    return () => {
      unsubscribeOrders();
      unsubscribeUpcoming();
      unsubscribeDentists();
    };
  }, [labId]);

  const handleDeleteOrder = async (id: string) => {
    if (!labId) return;
    try {
      await deleteDoc(doc(db, `laboratories/${labId}/orders`, id));
    } catch (err: any) {
      console.error('Falha ao apagar ordem do dashboard:', err);
      alert(`Erro: ${err.message}`);
    }
  };

  const firstName = userData?.displayName?.split(' ')[0] || 'Usuária';

  const stats = [
    { label: 'Fluxo de Produção', value: orders.length.toString(), icon: ClipboardList, color: 'text-brand-salmon', bg: 'bg-brand-salmon/10' },
    { label: 'Em Confecção', value: orders.filter(o => o.status === 'in_progress' || o.status === 'pending').length.toString(), icon: Clock, color: 'text-brand-deep', bg: 'bg-brand-deep/5' },
    { label: 'Obras Entregues', value: orders.filter(o => o.status === 'finished').length.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Portfólio Produtivo', value: dentistsCount.toString(), icon: Users, color: 'text-brand-salmon', bg: 'bg-brand-salmon/10' },
  ];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 bg-white p-10 md:p-14 rounded-[3rem] shadow-xl border border-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-salmon/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="z-10">
          <h2 className="text-4xl md:text-6xl font-serif text-brand-deep italic font-light leading-none">Bem-vinda, <br/><span className="font-bold not-italic font-serif text-brand-salmon">{firstName}</span></h2>
          <p className="text-neutral-400 text-xs md:text-sm font-medium mt-6 max-w-md leading-relaxed">
            Seu atelier laboratorial está operando em alta performance hoje. Confira os indicadores chave abaixo.
          </p>
        </div>
        
        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 bg-brand-beige border border-brand-salmon/10 rounded-2xl flex items-center justify-center text-brand-salmon shadow-sm transition-transform hover:scale-110">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-brand-salmon uppercase tracking-[0.2em]">Data de Referência</p>
            <p className="text-sm font-bold text-brand-deep">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => {
              if (stat.label === 'Fluxo de Produção') setActivePage('orders');
              if (stat.label === 'Em Confecção') setActivePage('orders');
              if (stat.label === 'Obras Entregues') setActivePage('financial');
              if (stat.label === 'Portfólio Produtivo') setActivePage('clients');
            }}
            className="bg-white p-8 rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl hover:shadow-brand-salmon/10 transition-all group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
               <stat.icon size={64} />
            </div>
            <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon size={22} />
            </div>
            <div className="mt-8">
              <h3 className="text-neutral-400 text-[8px] font-black tracking-[0.2em] uppercase">{stat.label}</h3>
              <p className="text-4xl font-serif font-black text-brand-deep mt-2">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Production Chart */}
        <div className="lg:col-span-2 bg-white p-10 md:p-12 rounded-[3.5rem] border border-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
             <BarChart3 size={300} />
          </div>
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
              <h3 className="font-serif text-2xl text-brand-deep font-bold italic">Dinâmica de <span className="not-italic">Produção</span></h3>
              <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mt-1">Volume de ordens nos últimos 7 dias</p>
            </div>
            <div className="bg-brand-beige px-6 py-2 rounded-full border border-white shadow-inner">
               <span className="text-[9px] font-black text-brand-salmon uppercase tracking-widest">Atelier Digital</span>
            </div>
          </div>
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAFAF9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#D4D4D4', fontWeight: 800 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#D4D4D4', fontWeight: 800 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(242, 132, 151, 0.05)' }}
                  contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(186, 126, 137, 0.2)', padding: '24px', backgroundColor: 'white' }}
                />
                <Bar dataKey="ordens" fill="#E69191" radius={[12, 12, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Items */}
        <div className="bg-white p-10 md:p-12 rounded-[3.5rem] border border-white shadow-xl">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-serif text-2xl text-brand-deep font-bold italic font-light">Prazos <span className="not-italic font-serif">Iminentes</span></h3>
            <button 
              onClick={() => setActivePage('orders')}
              className="w-10 h-10 bg-brand-beige text-brand-salmon rounded-full flex items-center justify-center hover:bg-brand-salmon hover:text-white transition-all shadow-sm"
            >
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="space-y-6">
            {upcomingOrders.filter(o => o.status !== 'finished').slice(0, 5).map((order) => (
              <motion.div 
                key={order.id} 
                whileHover={{ x: 6 }}
                onClick={() => setActivePage('orders')}
                className="flex items-center gap-5 p-4 rounded-3xl border border-transparent hover:bg-brand-beige/20 transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 bg-brand-beige border border-brand-salmon/5 rounded-2xl flex items-center justify-center text-brand-salmon group-hover:bg-white transition-all shadow-sm">
                  <Package size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-brand-deep truncate uppercase tracking-tight">{order.patientName}</p>
                  <div className="flex items-center gap-3 mt-1.5 ">
                    <span className="text-[8px] font-black text-brand-salmon uppercase tracking-widest bg-brand-salmon/5 px-2 py-0.5 rounded-full border border-brand-salmon/10">Vence: {order.dueDate}</span>
                    <span className="text-[8px] font-bold text-neutral-400 capitalize">{dentists[order.dentistId]?.toLowerCase() || '...' }</span>
                  </div>
                </div>
                <div className="text-brand-deep/20 group-hover:text-brand-salmon transition-colors">
                   <AlertCircle size={16} className={order.status === 'pending' ? 'animate-pulse' : ''} />
                </div>
              </motion.div>
            ))}
            {upcomingOrders.filter(o => o.status !== 'finished').length === 0 && (
              <div className="py-20 text-center flex flex-col items-center">
                <Sparkles size={32} className="text-brand-beige mb-4" />
                <p className="text-neutral-300 font-serif italic text-lg">Nenhuma obra em trânsito crítico.</p>
              </div>
            )}
          </div>
          
          <div className="mt-12 p-8 bg-brand-deep rounded-[2.5rem] text-white overflow-hidden relative group cursor-pointer" onClick={() => setActivePage('orders')}>
             <div className="absolute bottom-0 right-0 p-8 opacity-10 -translate-y-2 translate-x-2 group-hover:scale-110 transition-transform">
               <Plus size={80} />
             </div>
             <p className="text-[9px] font-black text-brand-salmon uppercase tracking-[0.2em] mb-2">Ação Rápida</p>
             <h4 className="text-xl font-serif italic font-light">Nova Ordem <br/><span className="not-italic font-bold font-serif">de Serviço</span></h4>
             <div className="mt-6 w-10 h-10 bg-brand-salmon rounded-full flex items-center justify-center shadow-xl shadow-brand-salmon/20">
                <Plus size={20} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
