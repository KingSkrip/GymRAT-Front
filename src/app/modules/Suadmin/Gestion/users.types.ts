export interface GestionUser {
  id: number;
  name: string;
  email: string;
  type: string;
  is_active: boolean;
  gym: { id: number; name: string } | null;
  branch: { id: number; name: string } | null;
  role: { id: number; name: string } | null;
  sub_role: { id: number; name: string } | null;
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