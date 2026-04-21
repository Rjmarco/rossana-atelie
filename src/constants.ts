import { Layers, Database, Package, Tag } from 'lucide-react';

export const CATEGORY_LABELS: Record<string, { label: string; icon: any }> = {
  fixed: { label: 'Prótese Fixa', icon: Layers },
  removable: { label: 'Reabilitação Oral', icon: Database },
  implant: { label: 'Protocolo & Implante', icon: Package },
  ortho: { label: 'Ortodontia Digital', icon: Tag },
};

export const COMMON_SERVICES = [
  // Prótese Fixa
  { name: 'Zircônia Monolítica', price: 450, category: 'fixed', leadTime: 7 },
  { name: 'Zircônia Maquiada', price: 550, category: 'fixed', leadTime: 7 },
  { name: 'Lente de Contato E-max', price: 650, category: 'fixed', leadTime: 10 },
  { name: 'E-max Prensado', price: 550, category: 'fixed', leadTime: 7 },
  { name: 'E-max Maquiado', price: 600, category: 'fixed', leadTime: 7 },
  { name: 'Metalocerâmica', price: 350, category: 'fixed', leadTime: 7 },
  { name: 'Metal Free (Zircônia)', price: 550, category: 'fixed', leadTime: 7 },
  { name: 'Provisório Resina 3D', price: 120, category: 'fixed', leadTime: 3 },
  { name: 'Inlay / Onlay E-max', price: 280, category: 'fixed', leadTime: 5 },
  { name: 'Núcleo Metálico Fundido', price: 120, category: 'fixed', leadTime: 3 },
  { name: 'Coroa Provisória Press', price: 150, category: 'fixed', leadTime: 3 },
  
  // Protocolo & Implante
  { name: 'Protocolo Zircônia (Unidade)', price: 6500, category: 'implant', leadTime: 15 },
  { name: 'Protocolo Acrílico (Unidade)', price: 3500, category: 'implant', leadTime: 5 },
  { name: 'Barra de Titânio CAD/CAM', price: 1800, category: 'implant', leadTime: 10 },
  { name: 'Coroa sobre Implante (E-max)', price: 650, category: 'implant', leadTime: 7 },
  { name: 'Coroa sobre Implante (Zircônia)', price: 600, category: 'implant', leadTime: 7 },
  { name: 'Componente Protético Individual', price: 300, category: 'implant', leadTime: 5 },
  { name: 'Guia de Furação Tomográfico', price: 250, category: 'implant', leadTime: 4 },
  { name: 'Link de Zircônia', price: 150, category: 'implant', leadTime: 2 },

  // Reabilitação Oral (Removível)
  { name: 'Prótese Total (Dentadura)', price: 750, category: 'removable', leadTime: 10 },
  { name: 'PPR Metálica (Roach)', price: 950, category: 'removable', leadTime: 12 },
  { name: 'Prótese Flexível (Flex)', price: 850, category: 'removable', leadTime: 10 },
  { name: 'Modelo 3D Alta Precisão', price: 80, category: 'removable', leadTime: 2 },
  { name: 'Enceramento Diagnóstico (Dente)', price: 40, category: 'removable', leadTime: 4 },
  { name: 'Guia Cirúrgico Simples', price: 400, category: 'removable', leadTime: 5 },
  { name: 'Placa de Clareamento (Par)', price: 100, category: 'removable', leadTime: 3 },
  { name: 'Placa Miorrelaxante (Bruxismo)', price: 350, category: 'removable', leadTime: 7 },

  // Ortodontia Digital
  { name: 'Alinhador Digital (Etapa)', price: 1200, category: 'ortho', leadTime: 15 },
  { name: 'Placa de Contenção Estética', price: 150, category: 'ortho', leadTime: 3 },
  { name: 'Protetor Bucal Esportivo', price: 250, category: 'ortho', leadTime: 5 },
  { name: 'Escaneamento Intraoral', price: 180, category: 'ortho', leadTime: 2 },
  { name: 'Setup Digital Ortodôntico', price: 500, category: 'ortho', leadTime: 7 },
];
