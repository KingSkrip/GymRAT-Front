export interface GestionUser {
  id: number;
  name: string;
  email: string;
    phone: string;
  type: string;
  is_active: boolean;
    permissions: number | null;   
  sub_permissions: number | null; 
  gym: { id: number; name: string } | null;
  branch: { id: number; name: string } | null;
  role: { id: number; name: string } | null;
  sub_role: { id: number; name: string } | null;
  membership?: {
  id: number;
  type: 'visit' | 'monthly' | 'yearly' | 'custom';
  price: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_valid: boolean;
  remaining_days: number;
  next_payment: string;
} | null;
coach?: { id: number; name: string } | null;
}

export interface ClientGymGroup {
  gym: { id: number; name: string } | null;
  users: GestionUser[];
}

export interface UsersResponse {
  success: boolean;
  superadmins: GestionUser[];
  admins: GestionUser[];
  clients: ClientGymGroup[];
}

export interface Membership {
  id: number;
  type: 'visit' | 'monthly' | 'yearly' | 'custom';
  price: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_valid: boolean;
  remaining_days: number;
  next_payment?: string;
}