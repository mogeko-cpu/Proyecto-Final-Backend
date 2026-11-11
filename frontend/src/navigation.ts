import { Users, LucideIcon } from 'lucide-react';

/** Enlaces del menú lateral. Cada módulo agrega aquí sus páginas. */
export type NavItem = { path: string; icon: LucideIcon; title: string };

/** Visibles para ADMIN y STAFF. */
export const staffLinks: NavItem[] = [];

/** Solo para ADMIN. */
export const adminLinks: NavItem[] = [{ path: '/users', icon: Users, title: 'Usuarios' }];
