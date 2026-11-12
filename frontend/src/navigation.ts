import { Activity, Archive, Bell, Settings, Users, LucideIcon } from 'lucide-react';

/** Enlaces del menú lateral. Cada módulo agrega aquí sus páginas. */
export type NavItem = { path: string; icon: LucideIcon; title: string };

/** Visibles para ADMIN y STAFF. */
export const staffLinks: NavItem[] = [
  { path: '/records', icon: Archive, title: 'Expedientes' },
  { path: '/alerts', icon: Bell, title: 'Alertas' },
  { path: '/environment', icon: Activity, title: 'Monitoreo ambiental' },
];

/** Solo para ADMIN. */
export const adminLinks: NavItem[] = [
  { path: '/deposits', icon: Settings, title: 'Depósitos y umbrales' },
  { path: '/users', icon: Users, title: 'Usuarios' },
];
