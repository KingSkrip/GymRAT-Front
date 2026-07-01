import { RoleEnum, SubRoleEnum } from './dataroles';

export interface RoleOption {
  id: number;
  name: string;
}

export interface ModalRoleConfig {
  allowedRoles: RoleEnum[];
  allowedSubRoles: SubRoleEnum[]; // vacío = no mostrar subroles
}

// 🔥 Aquí defines qué roles/subroles aparecen según el contexto del botón
export const MODAL_ROLE_CONFIG: Record<string, ModalRoleConfig> = {
  superadmin: {
    allowedRoles: [RoleEnum.superadmin],
    allowedSubRoles: [],
  },

  admin: {
    allowedRoles: [RoleEnum.gym_owner, RoleEnum.admin, RoleEnum.coach],
    allowedSubRoles: [
      SubRoleEnum.senior_coach,
      SubRoleEnum.junior_coach,
      SubRoleEnum.branch_manager,
      SubRoleEnum.receptionist,
      SubRoleEnum.personal_trainer,
    ],
  },

  client: {
    allowedRoles: [RoleEnum.client],
    allowedSubRoles: [],
  },
};
