import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Truck,
  Eye,
  FileText,
  Printer,
  Edit2,
  Trash2
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  where, 
  doc, 
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLaboratory } from '../context/LaboratoryContext';
import { cn } from '../lib/utils';
import { Order, OrderStatus } from '../types';
import OrderModal from '../components/OrderModal';
import OrderReceipt from '../components/OrderReceipt';

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: 'Aguardando', icon: Clock, color: 'text-neutral-500', bg: 'bg-neutral-50' },
  in_progress: { label: 'Em Atelier', icon: Clock, color: 'text-brand-accent', bg: 'bg-[#FDF2F4]' },
  waiting_shipment: { label: 'Finalizado', icon: CheckCircle2, color: 'text-brand-salmon', bg: 'bg-[#FFF5F2]' },
  finished: { label: 'Entregue', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  shipping: { label: 'Em Trânsito', icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
};

export default function OrdersPage() {
  const { labId, userData } = useLaboratory();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dentists, setDentists] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!labId) return;

    // Listen to Orders
    const q = query(collection(db, `laboratories/${labId}/orders`));
    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setOrders(ordersData);
      setLoading(false);
    }, (err) => {
      console.error('OrdersPage listener error:', err);
      setLoading(false);
    });

    // Fetch Dentists for lookup
    const unsubscribeDentists = onSnapshot(collection(db, `laboratories/${labId}/dentists`), (snap) => {
      const dentistMap: Record<string, string> = {};
      snap.docs.forEach(d => {
        dentistMap[d.id] = d.data().name;
      });
      setDentists(dentistMap);
    }, (err) => console.error('OrdersPage dentists listener error:', err));

    return () => {
      unsubscribeOrders();
      unsubscribeDentists();
    };
  }, [labId]);

  const handleDelete = async (orderId: string) => {
    if (!labId) return;
    try {
      await deleteDoc(doc(db, `laboratories/${labId}/orders`, orderId));
    } catch (err: any) {
      console.error('Falha ao apagar ordem:', err);
      alert(`Erro: ${err.message}`);
    }
  };

  const handleFinalize = async (order: Order) => {
    if (!labId) return;
    try {
      await updateDoc(doc(db, `laboratories/${labId}/orders`, order.id), {
        status: 'finished',
        updatedAt: serverTimestamp()
      });

      // Automatic financial posting
      await addDoc(collection(db, `laboratories/${labId}/transactions`), {
        description: `Serviço OS: ${order.orderNumber} - ${order.patientName}`,
        value: order.total,
        type: 'in',
        category: 'Prótese',
        createdAt: serverTimestamp(),
        labId,
        orderId: order.id
      });
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao finalizar: ${err.message}`);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif font-light text-brand-deep">Portfólio de <span className="font-semibold italic">Ordens</span></h2>
          <p className="text-neutral-400 text-sm font-medium tracking-wide mt-1">Acompanhamento meticuloso de cada peça em produção.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-3 px-6 py-2.5 text-xs font-bold tracking-widest uppercase text-neutral-400 bg-white border border-neutral-100 rounded-full hover:bg-neutral-50 transition-all no-print"
          >
            <FileText size={16} />
            Relatório
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-3 text-xs font-bold tracking-widest uppercase text-white bg-brand-accent rounded-full hover:bg-brand-deep hover:shadow-xl hover:shadow-brand-accent/20 transition-all shadow-lg shadow-brand-accent/10 active:scale-95"
          >
            <Plus size={18} />
            Nova Requisição
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-full border border-[#F5F2EF] shadow-sm flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setFilter('all')}
          className={cn(
            "px-6 py-2 text-[10px] font-black tracking-widest uppercase rounded-full transition-all duration-300 whitespace-nowrap",
            filter === 'all' ? "bg-brand-deep text-white shadow-md" : "text-neutral-400 hover:text-brand-accent hover:bg-brand-beige"
          )}
        >
          TODOS
        </button>
        {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((status) => (
          <button 
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "px-6 py-2 text-[10px] font-black tracking-widest uppercase rounded-full transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
              filter === status ? "bg-[#FDF2F4] text-brand-accent border border-brand-accent/10" : "text-neutral-400 hover:text-brand-accent hover:bg-brand-beige"
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", STATUS_CONFIG[status].color.replace('text', 'bg'))} />
            {STATUS_CONFIG[status].label}
          </button>
        ))}
      </div>

      {/* Orders Table - Desktop Only */}
      <div className="hidden lg:block bg-white rounded-[2.5rem] border border-[#F5F2EF] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-beige/50 border-b border-[#F5F2EF]">
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Identificação</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Paciente</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Especificações</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Profissional</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Estado Atual</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Entrega</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Honorários</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F2EF]">
              {filteredOrders.map((order) => {
                const config = STATUS_CONFIG[order.status];
                return (
                  <tr key={order.id} className="hover:bg-brand-beige/20 transition-all duration-300 group cursor-pointer">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-brand-deep group-hover:text-brand-accent transition-colors">{order.orderNumber}</span>
                        <span className="text-[9px] text-neutral-300 font-bold uppercase tracking-wider mt-1">
                          {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Recente'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-medium text-neutral-700">{order.patientName}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-3 py-1 bg-white border border-[#EFE9E1] rounded-lg text-brand-deep shadow-sm">
                          {order.shade || 'N/A'}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase italic">{order.shadeScale || 'UNIV'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-neutral-600 font-medium">
                      {dentists[order.dentistId] || 'Especialista'}
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        config.bg,
                        config.color,
                        config.color.replace('text', 'border').replace('600', '100')
                      )}>
                        <config.icon size={12} />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-neutral-500">
                      {order.dueDate}
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-brand-deep">
                      R$ {order.total.toFixed(2)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => setViewingOrder(order)}
                          className="p-2 text-neutral-300 hover:text-brand-accent hover:bg-brand-accent/5 rounded-lg transition-all"
                          title="Emitir Nota"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingOrder(order);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-neutral-300 hover:text-brand-deep hover:bg-neutral-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        {userData?.role === 'owner' && order.status !== 'finished' && (
                          <button 
                            onClick={() => handleFinalize(order)}
                            className="p-2 text-neutral-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Finalizar"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {userData?.role === 'owner' && (
                          <button 
                            onClick={() => handleDelete(order.id)}
                            className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Apagar"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Grid */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {filteredOrders.map((order) => {
          const config = STATUS_CONFIG[order.status];
          return (
            <motion.div 
              key={order.id}
              layout
              className="bg-white p-6 rounded-[2.5rem] border border-[#F5F2EF] shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">{order.orderNumber}</span>
                <span className={cn(
                  "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                  config.bg,
                  config.color,
                  config.color.replace('text', 'border').replace('600', '100')
                )}>
                  <config.icon size={10} />
                  {config.label}
                </span>
              </div>
              
              <div>
                <h4 className="text-lg font-serif font-bold text-brand-deep">{order.patientName}</h4>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                   Profissional: <span className="text-brand-accent">{dentists[order.dentistId] || 'Especialista'}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-[#F5F2EF]">
                <div>
                  <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mb-1">Vencimento</p>
                  <p className="text-sm font-bold text-neutral-500">{order.dueDate}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mb-1">Honorários</p>
                  <p className="text-sm font-black text-brand-deep">R$ {order.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button 
                  onClick={() => setViewingOrder(order)}
                  className="flex-1 py-3 bg-neutral-50 text-neutral-400 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <Printer size={14} />
                  Nota
                </button>
                <button 
                  onClick={() => {
                    setEditingOrder(order);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 py-3 bg-neutral-50 text-neutral-400 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <Edit2 size={14} />
                  Editar
                </button>
                {userData?.role === 'owner' && (
                  <button 
                    onClick={() => handleDelete(order.id)}
                    className="p-3 bg-rose-50 text-rose-400 rounded-2xl"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      {filteredOrders.length === 0 && (
        <div className="p-16 text-center bg-white rounded-[2.5rem] border border-[#F5F2EF] mt-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-beige text-brand-accent rounded-full mb-6">
            <Search size={32} />
          </div>
          <h3 className="text-brand-deep text-xl font-serif">Nenhum registro encontrado</h3>
          <p className="text-neutral-400 text-sm mt-2">Refine sua busca para encontrar o que procura.</p>
        </div>
      )}

      <OrderModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOrder(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingOrder(null);
        }}
        editingOrder={editingOrder}
      />

      <AnimatePresence>
        {viewingOrder && (
          <OrderReceipt 
            isOpen={!!viewingOrder}
            onClose={() => setViewingOrder(null)}
            order={viewingOrder}
            dentistName={dentists[viewingOrder.dentistId]}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
