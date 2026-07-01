import { RoleEnum, SubRoleEnum } from '../../../../../../modules/auth/roles/dataroles';
import { NavItem } from '../nav.type';

// =====================
// ROLES
// =====================
export const menuSuAdmin: NavItem[] = [
  {
    id: 'dashboards.inicio',
    title: 'Inicio',
    type: 'basic',
    icon: 'heroicons_outline:home',
    link: '/dashboard',
  },
  {
    id: 'clientes',
    title: 'clientes',
    type: 'basic',
    icon: 'heroicons_outline:user-group',
    link: '/Clientes',
  },
  {
    id: 'gyms',
    title: 'Gym´s',
    type: 'basic',
    icon: 'heroicons_outline:biceps-flexed',
    link: '/GYM´s',
  },
  {
    id: 'sucursales',
    title: 'Sucursales',
    type: 'basic',
    icon: 'heroicons_outline:building-storefront',
    link: '/Sucursales',
  },
  {
    id: 'gestión',
    title: 'Gestión',
    type: 'basic',
    icon: 'heroicons_outline:users',
    link: '/Gestion',
  },
];
export const menuOwner: NavItem[] = [
  {
    id: 'dashboards.inicio',
    title: 'Inicio',
    type: 'basic',
    icon: 'heroicons_outline:home',
    link: '/dashboard',
  },

  {
    id: 'gyms',
    title: 'Mis Gym´s',
    type: 'basic',
    icon: 'heroicons_outline:biceps-flexed',
    link: '/GYM´s',
  },
  {
    id: 'sucursales',
    title: 'Mis Sucursales',
    type: 'basic',
    icon: 'heroicons_outline:building-storefront',
    link: '/Sucursales',
  },

  {
    id: 'gestión',
    title: 'Gestión',
    type: 'basic',
    icon: 'heroicons_outline:users',
    link: '/Gestion',
  },
];

export const menuAdmin: NavItem[] = [
  {
    id: 'dashboards.inicio',
    title: 'Inicio',
    type: 'basic',
    icon: 'heroicons_outline:home',
    link: '/dashboard',
  },

  {
    id: 'gestión',
    title: 'Gestión',
    type: 'basic',
    icon: 'heroicons_outline:users',
    link: '/Gestion',
  },
];

export const menuSeniorCoach: NavItem[] = [
  {
    id: 'dashboards.inicio',
    title: 'Inicio',
    type: 'basic',
    icon: 'heroicons_outline:home',
    link: '/dashboard',
  },
   {
    id: 'gestión',
    title: 'Gestión',
    type: 'basic',
    icon: 'heroicons_outline:users',
    link: '/Gestion',
  },

  {
    id: 'expediente',
    title: 'Expediente',
    type: 'basic',
    icon: 'heroicons_outline:clipboard',
    link: '/Expediente',
  },
];

export const menuBranchManager: NavItem[] = [
  {
    id: 'dashboards.inicio',
    title: 'Inicio',
    type: 'basic',
    icon: 'heroicons_outline:home',
    link: '/dashboard',
  },
];

export const menuColaborador: NavItem[] = [
  {
    id: 'dashboards.inicio',
    title: 'Inicio',
    type: 'basic',
    icon: 'heroicons_outline:home',
    link: '/dashboard',
  },
];

export const menuClientes: NavItem[] = [
  {
    id: 'dashboards.inicio',
    title: 'Inicio',
    type: 'basic',
    icon: 'heroicons_outline:home',
    link: '/dashboard',
  },

  {
    id: 'app.asistencias',
    title: 'Mis asistencias',
    type: 'basic',
    icon: 'heroicons_outline:qr-code',
    link: '/asistencias',
  },
  {
    id: 'app.rutina',
    title: 'Mi rutina',
    type: 'basic',
    icon: 'heroicons_outline:biceps-flexed',
    link: '/rutina',
  },
  {
    id: 'mi.membresia',
    title: 'Mi membresia',
    type: 'basic',
    icon: 'heroicons_outline:credit-card',
    link: '/membresia',
  },
];
