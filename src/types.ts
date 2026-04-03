export enum UserRole {
  GUEST = 'guest',
  RECEPTIONIST = 'receptionist',
  ADMIN = 'admin',
  HOUSEKEEPING = 'housekeeping',
  MAINTENANCE = 'maintenance',
  KITCHEN = 'kitchen',
  ACCOUNTANT = 'accountant',
}

export enum RoomStatus {
  AVAILABLE = 'available',
  DIRTY = 'dirty',
  CLEANING = 'cleaning',
  CLEAN = 'clean',
  OUT_OF_ORDER = 'out_of_order',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled',
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  ON_THE_WAY = 'on_the_way',
  DELIVERED = 'delivered',
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phoneNumber?: string;
  isVIP?: boolean;
}

export interface Room {
  id: string;
  number: string;
  type: string;
  status: RoomStatus;
  price: number;
  description: string;
  amenities: string[];
  images: string[];
}

export interface Booking {
  id: string;
  guestId: string;
  guestName: string;
  roomId: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  status: BookingStatus;
  totalAmount: number;
  createdAt: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  extraCharges: { description: string; amount: number; date: string }[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'drinks' | 'snacks';
  isAvailable: boolean;
  image?: string;
}

export interface ServiceOrder {
  id: string;
  bookingId: string;
  guestId: string;
  roomId: string;
  roomNumber: string;
  items: { name: string; quantity: number; price: number }[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  type: 'food' | 'housekeeping' | 'other';
}

export interface MaintenanceTicket {
  id: string;
  roomId: string;
  roomNumber: string;
  description: string;
  status: 'open' | 'resolved';
  reportedBy: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface LostAndFound {
  id: string;
  roomNumber: string;
  description: string;
  dateFound: string;
  status: 'found' | 'claimed';
  claimedBy?: string;
}

export interface Transaction {
  id: string;
  bookingId?: string;
  amount: number;
  type: 'payment' | 'refund' | 'service_charge';
  method: string;
  date: string;
  description: string;
}
