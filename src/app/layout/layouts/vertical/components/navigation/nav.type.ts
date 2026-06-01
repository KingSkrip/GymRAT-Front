export interface NavItem {
  id: string;
  title: string;
  icon?: string;
  subtitle?: string;
  tooltip?: string;
  type: 'basic' | 'group' | 'collapsable';
  link?: string;
  children?: NavItem[];
}