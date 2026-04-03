import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  updateDoc, 
  doc, 
  addDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Room, RoomStatus, UserRole, Booking, ServiceOrder, MaintenanceTicket, LostAndFound, UserProfile, MenuItem } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter,
  Plus,
  MoreVertical,
  Bed,
  Utensils,
  Wrench,
  User,
  PieChart,
  Star,
  ShoppingBag,
  Trash2,
  Edit,
  PlusCircle,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MENU_ITEMS, ROOM_TYPES } from '../constants';

import { GuestPortal } from './GuestPortal';
import { ReceptionistDashboard } from './ReceptionistDashboard';
import { AccountantDashboard } from './AccountantDashboard';

// --- Shared Components ---

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h4 className="text-2xl font-bold text-slate-900 mb-2">{title}</h4>
          <p className="text-slate-500 mb-8">{message}</p>
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

// --- Role Specific Views ---

const HousekeepingView = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lostItems, setLostItems] = useState<LostAndFound[]>([]);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedRoomForMaintenance, setSelectedRoomForMaintenance] = useState<Room | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'rooms'), where('status', 'in', ['dirty', 'cleaning', 'clean']));
    const unsubscribeRooms = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'rooms'));

    const lq = query(collection(db, 'lost_and_found'), where('status', '==', 'found'));
    const unsubscribeLost = onSnapshot(lq, (snapshot) => {
      setLostItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LostAndFound)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'lost_and_found'));

    return () => {
      unsubscribeRooms();
      unsubscribeLost();
    };
  }, []);

  const updateStatus = async (roomId: string, status: RoomStatus) => {
    try {
      await updateDoc(doc(db, 'rooms', roomId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  const handleReportMaintenance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRoomForMaintenance) return;
    
    const formData = new FormData(e.currentTarget);
    const desc = formData.get('description') as string;
    const priority = formData.get('priority') as any;

    try {
      await addDoc(collection(db, 'maintenance'), {
        roomId: selectedRoomForMaintenance.id,
        roomNumber: selectedRoomForMaintenance.number,
        description: desc,
        status: 'open',
        priority: priority || 'medium',
        reportedBy: 'Housekeeping',
        createdAt: new Date().toISOString()
      });
      setIsMaintenanceModalOpen(false);
      setSelectedRoomForMaintenance(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'maintenance');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Cleaning Schedule</h3>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider">Dirty: {rooms.filter(r => r.status === 'dirty').length}</span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase tracking-wider">Cleaning: {rooms.filter(r => r.status === 'cleaning').length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <motion.div 
            layout
            key={room.id} 
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="font-bold text-xl text-slate-900">Room {room.number}</h4>
                <p className="text-sm text-slate-500 font-medium">{room.type}</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                room.status === 'dirty' ? 'bg-red-100 text-red-700' :
                room.status === 'cleaning' ? 'bg-yellow-100 text-yellow-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {room.status}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                {room.status === 'dirty' && (
                  <button 
                    onClick={() => updateStatus(room.id, RoomStatus.CLEANING)}
                    className="flex-1 bg-yellow-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-100"
                  >
                    Start Cleaning
                  </button>
                )}
                {room.status === 'cleaning' && (
                  <button 
                    onClick={() => updateStatus(room.id, RoomStatus.CLEAN)}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    Finish & Inspect
                  </button>
                )}
              </div>
              <button 
                onClick={() => { setSelectedRoomForMaintenance(room); setIsMaintenanceModalOpen(true); }}
                className="w-full bg-slate-50 text-slate-600 py-3 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <Wrench size={16} />
                Report Issue
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Maintenance Modal */}
      <AnimatePresence>
        {isMaintenanceModalOpen && selectedRoomForMaintenance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-xl font-bold text-slate-900">Report Issue: Room {selectedRoomForMaintenance.number}</h4>
                <button onClick={() => setIsMaintenanceModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleReportMaintenance} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                  <select name="priority" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                  <textarea name="description" required rows={4} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe the issue..." />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                  Submit Ticket
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lost & Found Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Search size={20} className="text-blue-600" />
          Lost & Found Log
        </h3>
        <div className="space-y-4">
          {lostItems.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-xl text-blue-600 border border-slate-100">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{item.description}</p>
                  <p className="text-xs text-slate-500">Found in Room {item.roomNumber} on {new Date(item.dateFound).toLocaleDateString()}</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
                Mark Claimed
              </button>
            </div>
          ))}
          {lostItems.length === 0 && (
            <p className="text-center text-slate-400 py-4 text-sm italic">No items currently logged.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const KitchenView = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), where('status', '!=', 'delivered'));
    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceOrder)));
    });
    const unsubscribeMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
      setMenu(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    });
    return () => {
      unsubscribeOrders();
      unsubscribeMenu();
    };
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const toggleMenuAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'menu', id), { isAvailable: !currentStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `menu/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-900">Kitchen Order Board</h3>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Live Orders: {orders.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Orders */}
        <div className="space-y-6">
          {orders.map(order => (
            <motion.div 
              layout
              key={order.id} 
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Room {order.roomNumber}</span>
                  <h4 className="font-bold text-xl">Order #{order.id.slice(-4)}</h4>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <span className="px-3 py-1 bg-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600">
                        {item.quantity}x
                      </span>
                      <span className="font-bold text-slate-800">{item.name}</span>
                    </div>
                    <span className="text-slate-400 font-medium">${item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Auto-billed to Room</span>
                  <span className="text-xl font-bold text-slate-900">${order.totalAmount}</span>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                {order.status === 'pending' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    Accept & Start Prep
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'on_the_way')}
                    className="flex-1 bg-yellow-500 text-white py-4 rounded-2xl font-bold text-sm hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-100"
                  >
                    Out for Delivery
                  </button>
                )}
                {order.status === 'on_the_way' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    Confirm Delivery
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <Utensils size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No active orders. Kitchen is clear!</p>
            </div>
          )}
        </div>

        {/* Menu Management */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit sticky top-6">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ShoppingBag size={20} className="text-blue-600" />
            Menu Availability
          </h3>
          <div className="space-y-4">
            {menu.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.isAvailable ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                    <Utensils size={18} />
                  </div>
                  <div>
                    <p className={`font-bold ${item.isAvailable ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{item.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{item.category}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleMenuAvailability(item.id, item.isAvailable)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    item.isAvailable 
                      ? 'bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100' 
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {item.isAvailable ? 'Mark Sold Out' : 'Make Available'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MaintenanceView = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'maintenance'), where('status', '==', 'open'));
    return onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceTicket)));
    });
  }, []);

  const resolveTicket = async (ticketId: string, roomId: string) => {
    try {
      await updateDoc(doc(db, 'maintenance', ticketId), { status: 'resolved' });
      await updateDoc(doc(db, 'rooms', roomId), { status: RoomStatus.DIRTY });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `maintenance/${ticketId}`);
    }
  };

  const setOutOfOrder = async (roomId: string) => {
    try {
      await updateDoc(doc(db, 'rooms', roomId), { status: RoomStatus.OUT_OF_ORDER });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-900">Maintenance Dashboard</h3>
        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-widest">
          Active Tickets: {tickets.length}
        </span>
      </div>

      <div className="space-y-4">
        {tickets.map(ticket => (
          <motion.div 
            layout
            key={ticket.id} 
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-6 hover:border-red-200 transition-colors"
          >
            <div className="flex items-start gap-6">
              <div className={`p-4 rounded-2xl ${
                ticket.priority === 'high' ? 'bg-red-100 text-red-600' :
                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                <Wrench size={32} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-xl text-slate-900">Room {ticket.roomNumber}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                    ticket.priority === 'high' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ticket.priority} Priority
                  </span>
                </div>
                <p className="text-slate-600 font-medium">{ticket.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-bold uppercase tracking-widest">
                  <span>Reported By: {ticket.reportedBy}</span>
                  <span>•</span>
                  <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setOutOfOrder(ticket.roomId)}
                className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all"
              >
                Flag Out of Order
              </button>
              <button 
                onClick={() => resolveTicket(ticket.id, ticket.roomId)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                Mark Fixed
              </button>
            </div>
          </motion.div>
        ))}
        {tickets.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
            <CheckCircle2 size={64} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 text-lg font-medium">All systems operational. No active tickets!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'menu'>('overview');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);

  useEffect(() => {
    const unsubscribeRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'rooms'));
    const unsubscribeMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'menu'));
    return () => {
      unsubscribeRooms();
      unsubscribeMenu();
    };
  }, []);

  const handleDeleteRoom = async (roomId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Room',
      message: 'Are you sure you want to delete this room? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'rooms', roomId));
          setConfirmConfig(null);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `rooms/${roomId}`);
        }
      }
    });
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Menu Item',
      message: 'Are you sure you want to delete this menu item?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'menu', itemId));
          setConfirmConfig(null);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `menu/${itemId}`);
        }
      }
    });
  };

  const handleSaveRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const roomData = {
      number: formData.get('number') as string,
      type: formData.get('type') as string,
      price: Number(formData.get('price')),
      description: formData.get('description') as string,
      status: (formData.get('status') as RoomStatus) || RoomStatus.AVAILABLE,
      amenities: (formData.get('amenities') as string).split(',').map(s => s.trim()),
      images: [(formData.get('image') as string) || 'https://picsum.photos/seed/room/800/600'],
    };

    try {
      if (editingRoom) {
        await updateDoc(doc(db, 'rooms', editingRoom.id), roomData);
      } else {
        await addDoc(collection(db, 'rooms'), roomData);
      }
      setIsRoomModalOpen(false);
      setEditingRoom(null);
    } catch (error) {
      handleFirestoreError(error, editingRoom ? OperationType.UPDATE : OperationType.CREATE, editingRoom ? `rooms/${editingRoom.id}` : 'rooms');
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemData = {
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      category: formData.get('category') as any,
      description: formData.get('description') as string,
      isAvailable: formData.get('isAvailable') === 'on',
      image: (formData.get('image') as string) || 'https://picsum.photos/seed/food/400/300',
    };

    try {
      if (editingMenuItem) {
        await updateDoc(doc(db, 'menu', editingMenuItem.id), itemData);
      } else {
        await addDoc(collection(db, 'menu'), itemData);
      }
      setIsMenuModalOpen(false);
      setEditingMenuItem(null);
    } catch (error) {
      handleFirestoreError(error, editingMenuItem ? OperationType.UPDATE : OperationType.CREATE, editingMenuItem ? `menu/${editingMenuItem.id}` : 'menu');
    }
  };

  return (
    <div className="space-y-10">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-px">
        {['overview', 'rooms', 'menu'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all relative ${
              activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard label="Total Revenue" value="$124,530" icon={PieChart} color="bg-blue-600" />
            <StatCard label="Occupancy Rate" value="88%" icon={Bed} color="bg-emerald-600" />
            <StatCard label="Staff Performance" value="9.4/10" icon={User} color="bg-violet-600" />
            <StatCard label="Guest Satisfaction" value="4.8/5" icon={Star} color="bg-yellow-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">Revenue Analytics</h3>
                <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600">
                  <option>Last 30 Days</option>
                  <option>Last 6 Months</option>
                  <option>This Year</option>
                </select>
              </div>
              <div className="h-64 bg-slate-50 rounded-2xl flex items-end justify-between p-6 gap-4">
                {[40, 60, 45, 90, 75, 85, 95, 65, 55, 80, 70, 90].map((h, i) => (
                  <div key={i} className="flex-1 bg-blue-600 rounded-t-lg transition-all hover:bg-blue-700 cursor-pointer" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-8">Staff Activity</h3>
              <div className="space-y-6">
                {[
                  { name: 'Sarah (Front Desk)', action: 'Checked in 14 guests', time: '10m ago', color: 'bg-blue-100 text-blue-600' },
                  { name: 'Mike (Housekeeping)', action: 'Cleaned 8 rooms', time: '25m ago', color: 'bg-emerald-100 text-emerald-600' },
                  { name: 'Chef David', action: 'Completed 22 orders', time: '45m ago', color: 'bg-violet-100 text-violet-600' },
                  { name: 'Alex (Maintenance)', action: 'Resolved 2 tickets', time: '1h ago', color: 'bg-red-100 text-red-600' },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl ${s.color}`}>
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{s.action}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{s.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-3 bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold border border-slate-200 hover:bg-slate-100 transition-all">
                View All Staff
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-slate-900">Room Management</h3>
            <button
              onClick={() => { setEditingRoom(null); setIsRoomModalOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <PlusCircle size={20} />
              Add New Room
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
              <div key={room.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm group">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <img src={room.images[0]} alt={room.number} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => { setEditingRoom(room); setIsRoomModalOpen(true); }}
                      className="p-2 bg-white/90 backdrop-blur rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteRoom(room.id)}
                      className="p-2 bg-white/90 backdrop-blur rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-900">
                      Room {room.number}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-slate-900">{room.type}</h4>
                    <span className="text-blue-600 font-bold">${room.price}/night</span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{room.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.slice(0, 3).map((a, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider">{a}</span>
                    ))}
                    {room.amenities.length > 3 && <span className="text-[10px] font-bold text-slate-400">+{room.amenities.length - 3} more</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-slate-900">Menu Management</h3>
            <button
              onClick={() => { setEditingMenuItem(null); setIsMenuModalOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <PlusCircle size={20} />
              Add Food Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuItems.map(item => (
              <div key={item.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm group">
                <div className="h-40 bg-slate-100 relative overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      onClick={() => { setEditingMenuItem(item); setIsMenuModalOpen(true); }}
                      className="p-2 bg-white/90 backdrop-blur rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteMenuItem(item.id)}
                      className="p-2 bg-white/90 backdrop-blur rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900">{item.name}</h4>
                    <span className="text-emerald-600 font-bold text-sm">${item.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-3">{item.category}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${item.isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                      {item.isAvailable ? 'Available' : 'Sold Out'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isRoomModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-xl font-bold text-slate-900">{editingRoom ? 'Edit Room' : 'Add New Room'}</h4>
                <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveRoom} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Room Number</label>
                    <input name="number" defaultValue={editingRoom?.number} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                    <select name="type" defaultValue={editingRoom?.type} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                      {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price per Night</label>
                    <input name="price" type="number" defaultValue={editingRoom?.price} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                    <select name="status" defaultValue={editingRoom?.status} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                      {Object.values(RoomStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                  <textarea name="description" defaultValue={editingRoom?.description} rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amenities (comma separated)</label>
                  <input name="amenities" defaultValue={editingRoom?.amenities.join(', ')} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Image URL</label>
                  <input name="image" defaultValue={editingRoom?.images[0]} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                  {editingRoom ? 'Update Room' : 'Create Room'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isMenuModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-xl font-bold text-slate-900">{editingMenuItem ? 'Edit Menu Item' : 'Add Food Item'}</h4>
                <button onClick={() => setIsMenuModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveMenuItem} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name</label>
                  <input name="name" defaultValue={editingMenuItem?.name} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price</label>
                    <input name="price" type="number" defaultValue={editingMenuItem?.price} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                    <select name="category" defaultValue={editingMenuItem?.category} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                      {['breakfast', 'lunch', 'dinner', 'drinks', 'snacks'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Image URL</label>
                  <input name="image" defaultValue={editingMenuItem?.image} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                  <textarea name="description" defaultValue={editingMenuItem?.description} rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="isAvailable" defaultChecked={editingMenuItem?.isAvailable ?? true} id="isAvailable" className="w-4 h-4 text-blue-600 rounded" />
                  <label htmlFor="isAvailable" className="text-sm font-bold text-slate-700">Available for Order</label>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                  {editingMenuItem ? 'Update Item' : 'Add to Menu'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
};

export const Dashboard = ({
  role,
  user,
  isAuthenticated,
  onRequireAuth,
}: {
  role: UserRole;
  user: UserProfile;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}) => {
  switch (role) {
    case UserRole.ADMIN:
      return <AdminDashboard />;
    case UserRole.RECEPTIONIST:
      return <ReceptionistDashboard />;
    case UserRole.ACCOUNTANT:
      return <AccountantDashboard />;
    case UserRole.HOUSEKEEPING:
      return <HousekeepingView />;
    case UserRole.KITCHEN:
      return <KitchenView />;
    case UserRole.MAINTENANCE:
      return <MaintenanceView />;
    case UserRole.GUEST:
      return <GuestPortal user={user} isAuthenticated={isAuthenticated} onRequireAuth={onRequireAuth} />;
    default:
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 capitalize">{role} Dashboard</h2>
          <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
            <p className="text-slate-500 italic">Dashboard view for {role} is under construction.</p>
          </div>
        </div>
      );
  }
};
