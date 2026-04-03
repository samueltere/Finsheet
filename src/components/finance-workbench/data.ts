import type React from 'react';
import {
  Boxes,
  Building2,
  Grid2x2,
  Landmark,
  UserCircle2,
  Users,
} from 'lucide-react';

export type WorkspacePage =
  | 'business-status'
  | 'company-info'
  | 'customers'
  | 'vendors'
  | 'inventory'
  | 'banking'
  | 'companies';

export type TopTab = 'File' | 'Lists' | 'Maintain' | 'Tasks' | 'Analysis' | 'Reports' | 'User and Roles';

export type NavItem = {
  key: WorkspacePage;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

export type CustomerRow = {
  id: number;
  name: string;
  phone: string;
  balance: number;
};

export type VendorRow = {
  id: number;
  name: string;
  phone: string;
  balance: number;
  dueDate: string;
};

export type InventoryRow = {
  id: number;
  itemId: number;
  itemName: string;
  itemClass: string;
};

export type CompanyRow = {
  id: string;
  name: string;
  startDate: string;
  users: number;
  status: 'Active' | 'Inactive';
  createdOn: string;
};

export const navItems: NavItem[] = [
  { key: 'business-status', label: 'Business Status', icon: Grid2x2 },
  { key: 'company-info', label: 'Company Info', icon: Building2 },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'vendors', label: 'Vendors', icon: UserCircle2 },
  { key: 'inventory', label: 'Inventory', icon: Boxes },
  { key: 'banking', label: 'Banking', icon: Landmark },
  { key: 'companies', label: 'Companies', icon: Building2 },
];

export const topTabs: TopTab[] = ['File', 'Lists', 'Maintain', 'Tasks', 'Analysis', 'Reports', 'User and Roles'];

export const customersSeed: CustomerRow[] = [
  { id: 1, name: 'customer Name Prospect inactive General Histo', phone: '', balance: 0 },
  { id: 2, name: 'customer 2', phone: '', balance: 0 },
];

export const vendorsSeed: VendorRow[] = [
  { id: 1, name: 'vendor 1', phone: '0967564890', balance: 39840, dueDate: 'Apr 09, 2026' },
  { id: 2, name: 'vendor 2', phone: '', balance: -55140, dueDate: 'Apr 16, 2026' },
];

export const inventorySeed: InventoryRow[] = [
  { id: 1, itemId: 2, itemName: 'item 2', itemClass: 'Stock Item' },
  { id: 2, itemId: 1, itemName: 'item 1', itemClass: 'Stock Item' },
];

export const companiesSeed: CompanyRow[] = [
  { id: 'cmp-1', name: 'MESERET PLC 2011/2012 NEW5', startDate: 'Jul 08, 2018', users: 1, status: 'Active', createdOn: '25/03/2026 06:40' },
  { id: 'cmp-2', name: 'company5', startDate: 'Jul 01, 2022', users: 1, status: 'Active', createdOn: '18/03/2026 10:08' },
  { id: 'cmp-3', name: 'company4', startDate: 'Jul 08, 2018', users: 1, status: 'Active', createdOn: '17/03/2026 21:34' },
  { id: 'cmp-4', name: 'MESERET PLC 2011/2012 NEW4', startDate: 'Jul 08, 2018', users: 1, status: 'Active', createdOn: '13/03/2026 07:38' },
  { id: 'cmp-5', name: 'MESERET PLC 2011/2012 NEW', startDate: 'Jul 08, 2018', users: 1, status: 'Active', createdOn: '03/03/2026 18:27' },
  { id: 'cmp-6', name: 'MESERET PLC 2011/2012 NEW3', startDate: 'Jul 08, 2018', users: 1, status: 'Active', createdOn: '03/03/2026 17:32' },
  { id: 'cmp-7', name: 'MESERET PLC 2011/2012 NEW2', startDate: 'Jul 08, 2018', users: 1, status: 'Active', createdOn: '03/03/2026 09:54' },
  { id: 'cmp-8', name: 'MESERET PLC 2011/2012 NEW', startDate: 'Jul 06, 2018', users: 1, status: 'Active', createdOn: '02/03/2026 11:13' },
  { id: 'cmp-9', name: 'company 3', startDate: 'Jul 01, 2024', users: 1, status: 'Active', createdOn: '26/02/2026 08:11' },
  { id: 'cmp-10', name: 'Company 2', startDate: 'Jul 01, 2023', users: 1, status: 'Active', createdOn: '19/02/2026 07:44' },
];

export function toolbarDate() {
  return 'Apr 03, 2026';
}

export function toolbarPeriod() {
  return '08 Jul 2018 - 31 Jul 2018';
}

export function topTabForPage(page: WorkspacePage): TopTab {
  if (page === 'business-status' || page === 'company-info' || page === 'companies') return 'Analysis';
  return 'Lists';
}
