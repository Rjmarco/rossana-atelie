import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Calendar as CalendarIcon,
  Download,
  Filter,
  Trash2,
  Plus,
  FileSpreadsheet,
  Search
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  deleteDoc,
  orderBy,
  getDocs,
  serverTimestamp,
  addDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLaboratory } from '../context/LaboratoryContext';
import { cn } from '../lib/utils';
import TransactionModal from '../components/TransactionModal';
import MonthlyReport from '../components/MonthlyReport';
import OrderReceipt from '../components/OrderReceipt';
import { Service } from '../types';
import { CATEGORY_LABELS, COMMON_SERVICES } from '../constants';

export default function FinancialPage() {
  const { labId, isOwner } = useLaboratory();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [dentists, setDentists] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'orders' | 'services'>('transactions');

  // Service Management States
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('fixed');
  const [newLeadTime, setNewLeadTime] = useState('7');
  const [serviceSearch, setServiceSearch] = useState('');
  const [activeServiceCategory, setActiveServiceCategory] = useState('fixed');

  useEffect(() => {
    if (!labId) return;

    const q = query(collection(db, `laboratories/${labId}/transactions`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubscribeOrders = onSnapshot(collection(db, `laboratories/${labId}/orders`), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubscribeServices = onSnapshot(collection(db, `laboratories/${labId}/services`), (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    });

    const fetchDentists = async () => {
      const snap = await getDocs(collection(db, `laboratories/${labId}/dentists`));
      const dict: Record<string, string> = {};
      snap.forEach(d => { dict[d.id] = d.data().name; });
      setDentists(dict);
    };

    fetchDentists();

    return () => {
      unsubscribe();
      unsubscribeOrders();
      unsubscribeServices();
    };
  }, [labId]);

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
        updatedAt: serverTimestamp(),
      };

      if (editingServiceId) {
        await updateDoc(doc(db, `laboratories/${labId}/services`, editingServiceId), serviceData);
      } else {
        await addDoc(collection(db, `laboratories/${labId}/services`), {
          ...serviceData,
          createdAt: serverTimestamp(),
        });
      }

      setIsAddingService(false);
      setEditingServiceId(null);
      setNewName('');
      setNewPrice('');
      setNewLeadTime('7');
    } catch (err: any) {
      alert(`Erro ao salvar serviço: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!labId || !confirm('Deseja realmente excluir este serviço?')) return;
    try {
      await deleteDoc(doc(db, `laboratories/${labId}/services`, id));
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleSeedServices = async () => {
    if (!labId) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      COMMON_SERVICES.forEach(s => {
        const ref = doc(collection(db, `laboratories/${labId}/services`));
        batch.set(ref, { ...s, labId, createdAt: serverTimestamp() });
      });
      await batch.commit();
    } catch (err: any) {
      alert(`Erro ao carregar serviços: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEditService = (s: Service) => {
    setEditingServiceId(s.id);
    setNewName(s.name);
    setNewPrice(s.price.toString());
    setNewCategory(s.category);
    setNewLeadTime((s.leadTime || 7).toString());
    setIsAddingService(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!labId) return;
    try {
      await deleteDoc(doc(db, `laboratories/${labId}/transactions`, id));
    } catch (err: any) {
      console.error('Falha ao apagar transação:', err);
      alert(`Erro: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!labId) return;
    try {
      await deleteDoc(doc(db, `laboratories/${labId}/orders`, id));
    } catch (err: any) {
      console.error('Falha ao apagar ordem do financeiro:', err);
      alert(`Erro: ${err.message}`);
    }
  };

  // Calculate chart data based on last 6 months of transactions
  const chartData = React.useMemo(() => {
    const last6Months = [...Array(6)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short' });
      return { 
        name: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), 
        receita: 0, 
        despesa: 0,
        monthYear: `${d.getMonth()}-${d.getFullYear()}`
      };
    }).reverse();

    transactions.forEach(t => {
      if (t.createdAt?.seconds) {
        const d = new Date(t.createdAt.seconds * 1000);
        const key = `${d.getMonth()}-${d.getFullYear()}`;
        const match = last6Months.find(m => m.monthYear === key);
        if (match) {
          if (t.type === 'in') match.receita += t.value;
          else match.despesa += t.value;
        }
      }
    });

    return last6Months;
  }, [transactions]);

  const exportToExcel = () => {
    if (orders.length === 0 && transactions.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    // Prepare Orders Data
    const ordersSheetData = orders.map(o => ({
      'Número OS': o.orderNumber,
      'Paciente': o.patientName,
      'Status': o.status,
      'Data Entrega': o.dueDate,
      'Valor (R$)': o.total,
      'Cores': Array.isArray(o.shade) ? o.shade.join(', ') : o.shade,
      'Escala': o.shadeScale,
      'Dentista': dentists[o.dentistId] || 'Não identificado',
      'Data Criação': o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString() : 'N/A'
    }));

    // Prepare Transactions Data
    const transactionsSheetData = transactions.map(t => ({
      'Descrição': t.description,
      'Valor (R$)': t.value,
      'Tipo': t.type === 'in' ? 'Entrada' : 'Saída',
      'Categoria': t.category,
      'Data': t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleString() : 'N/A'
    }));

    // Create WorkBook
    const wb = XLSX.utils.book_new();
    
    // Add Sheets
    const wsOrders = XLSX.utils.json_to_sheet(ordersSheetData);
    const wsTransactions = XLSX.utils.json_to_sheet(transactionsSheetData);
    
    XLSX.utils.book_append_sheet(wb, wsOrders, "Ordens de Serviço");
    XLSX.utils.book_append_sheet(wb, wsTransactions, "Financeiro");

    // Save File
    XLSX.writeFile(wb, `Backup_Rossana_Atelier_${new Date().toLocaleDateString()}.xlsx`);
  };

  const totals = transactions.reduce((acc, curr) => {
    if (curr.type === 'in') acc.receita += curr.value;
    else acc.despesa += curr.value;
    return acc;
  }, { receita: 0, despesa: 0 });

  const saldo = totals.receita - totals.despesa;

  const handleOpenReceipt = (order: any) => {
    setSelectedOrderForReceipt(order);
  };

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-10">
      <div className="flex flex-row flex-wrap items-center justify-between gap-6 no-print">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-light text-brand-deep">Gestão <span className="font-semibold italic">Financeira</span></h2>
          <p className="text-neutral-400 text-sm font-medium tracking-wide mt-1">Fluxo de caixa, recebíveis e balanço patrimonial.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <button 
            onClick={exportToExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-[10px] font-black tracking-widest uppercase text-white bg-brand-deep rounded-full hover:bg-brand-accent transition-all shadow-lg"
          >
            <FileSpreadsheet size={16} />
            Backup
          </button>
          <button 
            onClick={() => setIsReportOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-[10px] font-black tracking-widest uppercase text-neutral-400 bg-white border border-neutral-100 rounded-full hover:bg-neutral-50 transition-all"
          >
            <CalendarIcon size={16} />
            Relatório
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 text-[10px] font-black tracking-widest uppercase text-white bg-emerald-600 rounded-full hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95 cursor-pointer"
          >
            <DollarSign size={18} />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-[#F5F2EF] shadow-sm group">
          <div className="flex items-center justify-between mb-6">
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl group-hover:scale-110 transition-transform">
              <ArrowUpRight size={26} />
            </div>
            <span className="text-[10px] font-black tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase">Entradas Totais</span>
          </div>
          <h3 className="text-neutral-400 text-[10px] font-black tracking-widest uppercase">Receitas Brutas</h3>
          <p className="text-3xl font-serif font-bold text-brand-deep mt-2">R$ {totals.receita.toFixed(2)}</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-[#F5F2EF] shadow-sm group">
          <div className="flex items-center justify-between mb-6">
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl group-hover:scale-110 transition-transform">
              <ArrowDownLeft size={26} />
            </div>
            <span className="text-[10px] font-black tracking-widest text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full uppercase">Saídas Totais</span>
          </div>
          <h3 className="text-neutral-400 text-[10px] font-black tracking-widest uppercase">Despesas Operacionais</h3>
          <p className="text-3xl font-serif font-bold text-brand-deep mt-2">R$ {totals.despesa.toFixed(2)}</p>
        </div>

        <div className="bg-brand-deep p-8 rounded-[2rem] shadow-2xl shadow-brand-deep/20 relative overflow-hidden text-white group">
          <DollarSign className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 rotate-12" />
          <div className="flex items-center justify-between mb-6 z-10 relative">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md group-hover:bg-brand-accent transition-colors">
              <CreditCard size={26} />
            </div>
            <span className="text-[10px] font-black tracking-widest text-brand-salmon bg-white/5 px-3 py-1.5 rounded-full uppercase">Lucro Bruto</span>
          </div>
          <h3 className="text-white/50 text-[10px] font-black tracking-widest uppercase z-10 relative">Resultado Operacional</h3>
          <p className="text-3xl font-serif font-bold mt-2 z-10 relative">R$ {saldo.toFixed(2)}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-[#F5F2EF] shadow-sm no-print">
        {/* ... chart content ... */}
        <div className="flex items-center justify-between mb-10">
          <h3 className="font-serif text-2xl text-brand-deep">Evolução do Faturamento</h3>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-neutral-400">Receita</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-salmon" />
              <span className="text-neutral-400">Despesas</span>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C08497" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#C08497" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F28482" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#F28482" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAFAF9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A3A3A3', fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A3A3A3', fontWeight: 600 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px' }}
              />
              <Area type="monotone" dataKey="receita" stroke="#C08497" strokeWidth={4} fillOpacity={1} fill="url(#colorRec)" />
              <Area type="monotone" dataKey="despesa" stroke="#F28482" strokeWidth={2} fillOpacity={1} fill="url(#colorDesp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions and Orders Tab Toggle */}
      <div className="flex bg-neutral-100 p-1.5 rounded-2xl w-full sm:w-fit no-print overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('transactions')}
          className={cn(
            "flex-1 sm:flex-none px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
            activeTab === 'transactions' ? "bg-white shadow-xl text-brand-accent" : "text-neutral-400"
          )}
        >
          Extrato Financeiro
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={cn(
            "flex-1 sm:flex-none px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
            activeTab === 'orders' ? "bg-white shadow-xl text-brand-accent" : "text-neutral-400"
          )}
        >
          Fluxo de Produção
        </button>
        <button 
          onClick={() => setActiveTab('services')}
          className={cn(
            "flex-1 sm:flex-none px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
            activeTab === 'services' ? "bg-white shadow-xl text-brand-accent" : "text-neutral-400"
          )}
        >
          Catálogo de Preços
        </button>
      </div>

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-[2.5rem] border border-[#F5F2EF] shadow-sm overflow-hidden">
          <div className="p-8 border-b border-[#F5F2EF] flex items-center justify-between">
            <h3 className="font-serif text-xl text-brand-deep">Movimentações Recentes</h3>
            <button className="p-2.5 hover:bg-neutral-50 rounded-full text-neutral-300 transition-colors">
              <Filter size={18} />
            </button>
          </div>
          <div className="divide-y divide-[#F5F2EF]">
            {transactions.map((t) => (
              <div key={t.id} className="p-8 flex items-center justify-between hover:bg-brand-beige/20 transition-all cursor-pointer group">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                    t.type === 'in' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {t.type === 'in' ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-deep leading-none">{t.description || t.desc || 'Lançamento Manual'}</p>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-2">
                      {t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleString() : 'Recente'} • <span className="text-brand-accent">{t.category || t.cat || 'Geral'}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-serif font-black",
                    t.type === 'in' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {t.type === 'in' ? '+' : '-'} R$ {t.value.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 justify-end mt-1">
                     <span className="text-[9px] font-black text-neutral-300 uppercase tracking-[0.2em]">Consolidado</span>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         handleDeleteTransaction(t.id);
                       }}
                       className="text-neutral-400 hover:text-rose-500 transition-colors p-1 no-print"
                     >
                       <Trash2 size={12} />
                     </button>
                  </div>
                </div>
              </div>
            ))}

            {transactions.length === 0 && !loading && (
               <div className="p-20 text-center text-neutral-300 font-serif italic">Nenhuma movimentação registrada.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-[2.5rem] border border-[#F5F2EF] shadow-sm overflow-hidden">
          <div className="p-8 border-b border-[#F5F2EF]">
            <h3 className="font-serif text-xl text-brand-deep">Portfólio Histórico</h3>
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mt-1">Trabalhos registrados e faturamento bruto associado</p>
          </div>
          <div className="divide-y divide-[#F5F2EF]">
            {orders.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map((order) => (
              <div key={order.id} className="p-8 flex items-center justify-between hover:bg-brand-beige/20 transition-all cursor-pointer group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400 group-hover:bg-brand-accent group-hover:text-white transition-all">
                    <CalendarIcon size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-brand-deep">{order.patientName}</p>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-neutral-100 rounded-md text-neutral-400">#{order.orderNumber}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-2">
                       {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Recente'} • Profissional: <span className="text-brand-accent">{dentists[order.dentistId] || 'Especialista'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-serif font-black text-brand-deep">R$ {order.total.toFixed(2)}</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${order.status === 'finished' ? 'text-emerald-600' : 'text-brand-salmon'}`}>
                      {order.status === 'finished' ? 'Finalizado' : 'Em Produção'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReceipt(order);
                      }}
                      className="p-2 text-brand-salmon hover:bg-brand-salmon/10 rounded-lg transition-colors no-print flex items-center gap-2"
                      title="Emitir Nota"
                    >
                      <Download size={16} />
                      <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Nota</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOrder(order.id);
                      }}
                      className="p-2 text-neutral-400 hover:text-rose-500 transition-colors no-print"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {orders.length === 0 && (
               <div className="p-20 text-center text-neutral-300 font-serif italic">Nenhuma ordem de serviço registrada.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex bg-neutral-100 p-1 rounded-xl w-fit overflow-x-auto no-scrollbar">
              {Object.entries(CATEGORY_LABELS).map(([key, { label, icon: Icon }]) => (
                <button
                  key={key}
                  onClick={() => setActiveServiceCategory(key)}
                  className={cn(
                    "px-6 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 whitespace-nowrap",
                    activeServiceCategory === key ? "bg-white shadow-md text-brand-accent" : "text-neutral-400 hover:text-neutral-600"
                  )}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white px-6 h-12 rounded-full border border-neutral-100 flex items-center gap-3 shadow-sm focus-within:shadow-md transition-all">
                <Search size={16} className="text-neutral-300" />
                <input 
                  type="text" 
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Filtrar trabalhos..."
                  className="bg-transparent border-none outline-none text-xs font-bold w-40"
                />
              </div>
              {isOwner && (
                <button 
                  onClick={() => setIsAddingService(true)}
                  className="px-6 h-12 bg-brand-deep text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-brand-salmon transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> Novo
                </button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {isAddingService && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[2rem] border border-brand-beige shadow-xl flex flex-col md:flex-row gap-6 items-end"
              >
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Nome do Trabalho</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full h-12 px-4 bg-neutral-50 rounded-xl border border-transparent focus:border-brand-accent/20 outline-none text-sm font-bold"
                  />
                </div>
                <div className="w-full md:w-32 space-y-2">
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Preço (R$)</label>
                  <input 
                    type="number" 
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full h-12 px-4 bg-neutral-50 rounded-xl border border-transparent focus:border-brand-accent/20 outline-none text-sm font-bold"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveService} className="h-12 px-6 bg-brand-salmon text-white text-[10px] font-black uppercase rounded-xl">Gravar</button>
                  <button onClick={() => setIsAddingService(false)} className="h-12 px-6 bg-neutral-100 text-neutral-400 text-[10px] font-black uppercase rounded-xl">Cancelar</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.filter(s => s.category === activeServiceCategory && s.name.toLowerCase().includes(serviceSearch.toLowerCase())).map((service) => (
              <div key={service.id} className="bg-white p-6 rounded-[2rem] border border-[#F5F2EF] hover:shadow-xl transition-all group flex flex-col justify-between h-48">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-brand-deep leading-tight italic">{service.name}</h4>
                    {isOwner && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditService(service)} className="p-1.5 hover:bg-neutral-50 rounded-lg text-neutral-300 hover:text-brand-accent"><FileSpreadsheet size={14} /></button>
                        <button onClick={() => handleDeleteService(service.id)} className="p-1.5 hover:bg-neutral-50 rounded-lg text-neutral-300 hover:text-rose-500"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                  <div>
                    <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">Honorários</p>
                    <p className="text-xl font-serif font-black text-brand-deep">R$ {service.price.toFixed(0)}</p>
                  </div>
                  <div className="px-3 py-1 bg-brand-beige/30 rounded-lg text-[9px] font-black text-brand-salmon uppercase tracking-widest">
                    {service.leadTime || 7} Dias
                  </div>
                </div>
              </div>
            ))}
            
            {services.length === 0 && (
              <div className="col-span-full py-20 text-center flex flex-col items-center">
                <p className="text-neutral-400 font-serif italic mb-4">Catálogo de serviços vazio.</p>
                <button onClick={handleSeedServices} className="px-8 py-3 bg-brand-beige text-brand-salmon text-[10px] font-black uppercase rounded-full">Carregar Serviços Padrão</button>
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <TransactionModal isOpen={true} onClose={() => setIsModalOpen(false)} />
        )}
        
        {isReportOpen && (
          <MonthlyReport 
            isOpen={true} 
            onClose={() => setIsReportOpen(false)} 
            orders={orders}
            transactions={transactions}
            dentists={dentists}
          />
        )}

        {selectedOrderForReceipt && (
          <OrderReceipt
            isOpen={true}
            onClose={() => setSelectedOrderForReceipt(null)}
            order={selectedOrderForReceipt}
            dentistName={dentists[selectedOrderForReceipt.dentistId]}
          />
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .p-10 { padding: 0 !important; }
          .shadow-sm, .shadow-2xl { box-shadow: none !important; }
          .rounded-[2rem], .rounded-[2.5rem] { border-radius: 0 !important; border: none !important; }
          .bg-brand-beige\\/30 { background: white !important; }
          main { overflow: visible !important; }
        }
      `}</style>
    </div>
  );
}
