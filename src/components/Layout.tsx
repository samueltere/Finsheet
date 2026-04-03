import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Calendar, 
  Settings, 
  ClipboardList, 
  Utensils, 
  Wrench, 
  PieChart,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X
} from 'lucide-react';

interface SidebarItemProps {
  key?: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
      active 
        ? 'bg-blue-600 text-white shadow-sm' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

export const Layout = ({
  children,
  role,
  onLogout,
  isAuthenticated,
  userName,
  onSignIn,
  onSignUp,
}: {
  children: React.ReactNode;
  role: string;
  onLogout: () => void;
  isAuthenticated: boolean;
  userName: string;
  onSignIn: () => void;
  onSignUp: () => void;
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [expandedActor, setExpandedActor] = React.useState<string | null>(role);

  React.useEffect(() => {
    setExpandedActor(role);
  }, [role]);

  const actorMenu = [
    {
      id: 'guest',
      label: 'Guest',
      icon: <Calendar size={20} />,
      roles: ['guest'],
      subItems: ['Rooms & Service', 'Food & Service', 'Menu TBA', 'My Booking'],
    },
    {
      id: 'receptionist',
      label: 'Receptionist',
      icon: <ClipboardList size={20} />,
      roles: ['receptionist'],
      subItems: ['Guest Reservations', 'Check In / Out', 'Room Allocation', 'Billing Desk'],
    },
    {
      id: 'housekeeping',
      label: 'Housekeeping',
      icon: <User size={20} />,
      roles: ['housekeeping'],
      subItems: ['Rooms & Service', 'Cleaning Queue', 'Lost & Found', 'Issue Reporting'],
    },
    {
      id: 'kitchen',
      label: 'Kitchen',
      icon: <Utensils size={20} />,
      roles: ['kitchen'],
      subItems: ['Food & Service', 'Live Orders', 'Menu TBA', 'Availability'],
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: <Wrench size={20} />,
      roles: ['maintenance'],
      subItems: ['Open Tickets', 'Room Repairs', 'Resolved Jobs', 'Priority Queue'],
    },
    {
      id: 'accountant',
      label: 'Accountant',
      icon: <PieChart size={20} />,
      roles: ['accountant'],
      subItems: ['Transactions', 'Revenue', 'Refunds', 'Reports'],
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: <Settings size={20} />,
      roles: ['admin'],
      subItems: ['Overview', 'Rooms', 'Menu', 'Staff', 'System Settings'],
    },
  ];

  const filteredMenu = actorMenu.filter(item => item.roles.includes(role));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="brand-shell text-white flex flex-col shadow-xl z-20"
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <img
            src="/brand/elitiro-logo.svg"
            alt="Elitiro logo"
            className="h-10 w-auto rounded-xl bg-white/95 p-1.5"
          />
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredMenu.map((item) => (
            <div key={item.id} className="space-y-1">
              <SidebarItem
                icon={item.icon}
                label={item.label}
                active={expandedActor === item.id}
                onClick={() => setExpandedActor(prev => (prev === item.id ? null : item.id))}
              />
              {expandedActor === item.id && (
                <div className="ml-4 space-y-1 border-l border-slate-800 pl-3">
                  {item.subItems.map((subItem) => (
                    <button
                      key={subItem}
                      className="w-full text-left text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                      onClick={() => {}}
                    >
                      {subItem}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {isAuthenticated && (
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="brand-section h-16 border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500 capitalize">{role}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-200 brand-ring">
                {(userName || 'U').slice(0, 2).toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onSignIn}
                className="inline-flex items-center gap-2 bg-white/90 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <LogIn size={16} />
                Sign in
              </button>
              <button
                onClick={onSignUp}
                className="inline-flex items-center gap-2 bg-blue-600 rounded-xl px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 brand-ring"
              >
                <UserPlus size={16} />
                Sign up
              </button>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
