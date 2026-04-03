import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Room, RoomStatus, Booking, BookingStatus, ServiceOrder, UserProfile, OrderStatus, MenuItem } from '../types';
import { MENU_ITEMS } from '../constants';
import { 
  Search, 
  Calendar, 
  CreditCard, 
  Utensils, 
  Star, 
  History,
  CheckCircle2,
  ShoppingBag,
  Plus,
  Minus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GuestPortal = ({
  user,
  isAuthenticated,
  onRequireAuth,
}: {
  user: UserProfile;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'rooms-service' | 'my-bookings' | 'food-service' | 'menu-tba' | 'feedback'>('rooms-service');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [cart, setCart] = useState<{ id: string; name: string; quantity: number; price: number }[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const q = query(collection(db, 'rooms'), where('status', '==', 'available'));
    const unsubscribeRooms = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'rooms'));

    const bq = query(collection(db, 'bookings'), where('guestId', '==', user.uid));
    const unsubscribeBookings = onSnapshot(bq, (snapshot) => {
      setMyBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'bookings'));

    const mq = query(collection(db, 'menu'), where('isAvailable', '==', true));
    const unsubscribeMenu = onSnapshot(mq, (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'menu'));

    return () => {
      unsubscribeRooms();
      unsubscribeBookings();
      unsubscribeMenu();
    };
  }, [user.uid]);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, quantity: 1, price: item.price }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    if (!isAuthenticated) {
      setNotification({ type: 'error', message: 'Please sign in or sign up to place an order.' });
      onRequireAuth();
      return;
    }
    
    const activeBooking = myBookings.find(b => b.status === BookingStatus.CHECKED_IN);
    if (!activeBooking) {
      setNotification({ type: 'error', message: 'You must be checked in to order room service.' });
      return;
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    try {
      await addDoc(collection(db, 'orders'), {
        bookingId: activeBooking.id,
        guestId: user.uid,
        roomId: activeBooking.roomId,
        roomNumber: activeBooking.roomNumber,
        items: cart,
        status: OrderStatus.PENDING,
        totalAmount: total,
        type: 'food',
        createdAt: new Date().toISOString()
      });

      setCart([]);
      setNotification({ type: 'success', message: 'Order placed successfully!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  const handleBooking = async () => {
    if (!selectedRoom) return;
    if (!isAuthenticated) {
      setNotification({ type: 'error', message: 'Please sign in or sign up to continue booking.' });
      setIsBookingModalOpen(false);
      onRequireAuth();
      return;
    }

    const bookingData = {
      guestId: user.uid,
      guestName: user.displayName,
      roomId: selectedRoom.id,
      roomNumber: selectedRoom.number,
      checkInDate: new Date().toISOString(),
      checkOutDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
      status: BookingStatus.CONFIRMED,
      totalAmount: selectedRoom.price * 2,
      paymentStatus: 'paid',
      extraCharges: [],
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'bookings'), bookingData);
      setIsBookingModalOpen(false);
      setSelectedRoom(null);
      setNotification({ type: 'success', message: 'Booking confirmed!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100 rounded-xl">
        {[
          { id: 'rooms-service', label: 'Rooms & Service', icon: Search },
          { id: 'food-service', label: 'Food & Service', icon: Utensils },
          { id: 'menu-tba', label: 'Menu TBA', icon: Star },
          { id: 'my-bookings', label: 'My Booking', icon: Calendar },
          { id: 'feedback', label: 'Feedback', icon: Star },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'rooms-service' && (
          <motion.div 
            key="rooms-service"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {rooms.map(room => (
              <div key={room.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 group hover:shadow-md transition-shadow">
                <div className="h-48 bg-slate-200 relative">
                  <img 
                    src={room.images[0] || `https://picsum.photos/seed/${room.number}/800/600`} 
                    alt={room.type}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-blue-600">
                    ${room.price}/night
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900">Room {room.number}</h3>
                  <p className="text-slate-500 text-sm mb-4">{room.type}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {room.amenities.slice(0, 3).map(a => (
                      <span key={a} className="px-2 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold uppercase rounded border border-slate-100">
                        {a}
                      </span>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      if (!isAuthenticated) {
                        setNotification({ type: 'info', message: 'Sign in or sign up to book this room.' });
                        onRequireAuth();
                        return;
                      }
                      setSelectedRoom(room);
                      setIsBookingModalOpen(true);
                    }}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'my-bookings' && (
          <motion.div 
            key="bookings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {myBookings.map(booking => (
              <div key={booking.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Room {booking.roomNumber}</h4>
                    <p className="text-sm text-slate-500">
                      {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase font-bold">Status</p>
                    <span className={`text-sm font-bold capitalize ${
                      booking.status === BookingStatus.CHECKED_IN ? 'text-emerald-600' : 'text-blue-600'
                    }`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase font-bold">Total</p>
                    <p className="text-sm font-bold text-slate-900">${booking.totalAmount}</p>
                  </div>
                  <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                    <History size={20} />
                  </button>
                </div>
              </div>
            ))}
            {myBookings.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No bookings found. Start by browsing rooms!</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'food-service' && (
          <motion.div 
            key="food-service"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {menuItems.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center text-slate-400">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Utensils size={24} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                        <p className="text-sm text-blue-600 font-bold">${item.price}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => addToCart(item)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ))}
                {menuItems.length === 0 && (
                  <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500 italic">No menu items available at the moment.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit sticky top-6">
              <div className="flex items-center gap-2 mb-6">
                <ShoppingBag className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold">Your Order</h3>
              </div>
              
              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">${item.price} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-slate-600"><Minus size={14} /></button>
                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-slate-600"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <p className="text-center text-slate-400 py-8 text-sm italic">Your cart is empty</p>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${cart.reduce((acc, i) => acc + (i.price * i.quantity), 0)}</span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={placeOrder}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                  Place Order
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'menu-tba' && (
          <motion.div
            key="menu-tba"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center"
          >
            <Utensils size={40} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Menu TBA</h3>
            <p className="text-slate-500">Updated curated menu options will be available soon.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="h-48 bg-slate-200 relative">
                <img 
                  src={`https://picsum.photos/seed/${selectedRoom.number}/800/600`} 
                  alt={selectedRoom.type}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setIsBookingModalOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-white/90 rounded-full text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Confirm Booking</h3>
                  <p className="text-slate-500">Room {selectedRoom.number} - {selectedRoom.type}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Check-in</p>
                    <p className="font-bold text-slate-900">Today</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Check-out</p>
                    <p className="font-bold text-slate-900">In 2 Days</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 border-t border-slate-100">
                  <span className="font-bold text-slate-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">${selectedRoom.price * 2}</span>
                </div>

                <button 
                  onClick={handleBooking}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                >
                  Pay & Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' :
              notification.type === 'error' ? 'bg-red-600 border-red-500 text-white' :
              'bg-blue-600 border-blue-500 text-white'
            }`}
          >
            <CheckCircle2 size={20} />
            <span className="font-bold text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
