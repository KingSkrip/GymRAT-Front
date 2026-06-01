// app/core/auth/roles/dataroles-dashboard.ts
import { RoleEnum } from './dataroles';

export const DashboardByRole = {
  [RoleEnum.superadmin]: '/dashboard',
  [RoleEnum.gym_owner]: '/dashboard',
  [RoleEnum.admin]: '/dashboard',
  [RoleEnum.coach]: '/dashboard',
  [RoleEnum.client]: '/dashboard',
};
