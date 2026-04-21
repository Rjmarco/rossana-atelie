export type OrderStatus = 'pending' | 'in_progress' | 'waiting_shipment' | 'finished' | 'shipping';

export interface Dentist {
  id: string;
  name: string;
  clinicId?: string; // Optional link to a clinic
  clinicName: string; // Keep for quick display
  phone: string;
  address?: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  category: 'fixed' | 'removable' | 'implant' | 'ortho';
  leadTime?: number; // Days to complete
}

export interface Order {
  id: string;
  orderNumber: string;
  dentistId: string;
  clinicId?: string;
  patientName: string;
  serviceId: string; // Main service
  secondaryServices?: string[]; // Optional additional services
  status: OrderStatus;
  createdAt: any; // Firebase Timestamp or string
  dueDate: string;
  total: number;
  shade?: string[]; // Allowed multiple shades (e.g. ['A2', 'A1'])
  shadeScale?: string; // Scale used (e.g. VITA Classical)
  arch?: 'superior' | 'inferior' | 'both';
  teeth?: number[]; // Selected teeth numbers
  notes?: string;
  labId: string; // To multi-tenant
}

export interface Transaction {
  id: string;
  description: string;
  value: number;
  type: 'in' | 'out';
  category: string;
  createdAt: any;
}
