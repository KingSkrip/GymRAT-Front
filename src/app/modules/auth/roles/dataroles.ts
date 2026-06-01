// app/core/auth/roles/dataroles.ts

// Roles principales
export const Roles = {
  1: 'superadmin',
  2: 'gym_owner',
  3: 'admin',
  4: 'coach',
  5: 'client'
};

export enum RoleEnum {
  superadmin = 1,
  gym_owner = 2,
  admin = 3,
  coach = 4,
  client = 5,
}

// Subroles
export const SubRoles = {
  1: 'senior_coach',
  2: 'junior_coach',
  3: 'branch_manager',
  4: 'receptionist',
  5: 'personal_trainer',
};

export enum SubRoleEnum {
  senior_coach = 1,
  junior_coach = 2,
  branch_manager = 3,
  receptionist = 4,
  personal_trainer = 5,
}

//acceso para submenu de produccion
export const SubRolesWithChildMenuAccess = new Set([
  // SubRoleEnum.superadmin,
  // SubRoleEnum.gym_owner,
  // SubRoleEnum.admin,
  // SubRoleEnum.coach,
  // SubRoleEnum.client,
]);

export const RolesWithChildMenuAccess = new Set([RoleEnum.superadmin, RoleEnum.gym_owner]);
