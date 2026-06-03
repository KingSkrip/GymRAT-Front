import { SubRole } from "./subroles.types";

export interface Role {
  id: number;
  name: string;
  users_count: number;
  sub_roles: SubRole[];
}