import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  updateDoc, 
  doc, 
  addDoc, 
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Room, RoomStatus, Booking, BookingStatus, UserProfile, UserRole } from '../types';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  LogOut, 
  Search, 
  Filter,
  MoreVertical,
  Plus,
  CreditCard,
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ReceptionistDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const unsubscribeBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    });

    const unsubscribeRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)));
    });

    return () => {
      unsubscribeBookings();
      unsubscribeRooms();
    };
  }, []);

  const handleCheckIn = async (booking: Booking) => {
    const batch = writeBatch(db);
    
    // Update booking status
    batch.update(doc(db, 'bookings', booking.id), { 
      status: BookingStatus.CHECKED_IN,
      checkInDate: new Date().toISOString()
    });

    // Update room status
    batch.update(doc(db, 'rooms', booking.roomId), { 
      status: RoomStatus.CLEANING // Or occupied if we had that state
    });

    await batch.commit();
    alert(`Guest ${booking.guestName} checked in to Room ${booking.roomNumber}`);
  };

  const handleCheckOut = async (booking: Booking) => {
    const batch = writeBatch(db);
    
    // Update booking status
    batch.update(doc(db, 'bookings', booking.id), { 
      status: BookingStatus.CHECKED_OUT,
      checkOutDate: new Date().toISOString()
    });

    // Update room status to DIRTY
    batch.update(doc(db, 'rooms', booking.roomId), { 
      status: RoomStatus.DIRTY 
    });

    // Create transaction
    const transactionRef = doc(collection(db, 'transactions'));
    batch.set(transactionRef, {
      bookingId: booking.id,
      amount: booking.totalAmount,
      type: 'payment',
      method: 'credit_card',
      date: new Date().toISOString(),
      description: `Final payment for Room ${booking.roomNumber}`
    });

    await batch.commit();
    alert(`Guest ${booking.guestName} checked out from Room ${booking.roomNumber}`);
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         b.roomNumber.includes(searchQuery);
    const matchesFilter = filter === 'all' || b.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Users size={20} />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase">Expected Arrivals</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {bookings.filter(b => b.status === BookingStatus.CONFIRMED).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase">In-House Guests</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {bookings.filter(b => b.status === BookingStatus.CHECKED_IN).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <LogOut size={20} />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase">Expected Departures</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {bookings.filter(b => b.status === BookingStatus.CHECKED_IN).length}
          </p>
        </div>
      </div>

      {/* Booking Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900">Guest Reservations</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search guest or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value={BookingStatus.CONFIRMED}>Confirmed</option>
              <option value={BookingStatus.CHECKED_IN}>Checked In</option>
              <option value={BookingStatus.CHECKED_OUT}>Checked Out</option>
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
              <Plus size={18} />
              New Booking
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Guest</th>
                <th className="px-6 py-4">Room</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map(booking => (
                <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{booking.guestName}</p>
                    <p className="text-xs text-slate-500">#{booking.id.slice(-6)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">
                      Room {booking.roomNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      booking.status === BookingStatus.CHECKED_IN ? 'bg-emerald-100 text-emerald-700' :
                      booking.status === BookingStatus.CONFIRMED ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {booking.status === BookingStatus.CONFIRMED && (
                        <button 
                          onClick={() => handleCheckIn(booking)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                        >
                          Check In
                        </button>
                      )}
                      {booking.status === BookingStatus.CHECKED_IN && (
                        <button 
                          onClick={() => handleCheckOut(booking)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                        >
                          Check Out
                        </button>
                      )}
                      <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBookings.length === 0 && (
            <div className="py-20 text-center">
              <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No reservations found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
