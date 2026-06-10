import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Layers, Settings as SettingsIcon, User, QrCode, Bell, History, Users, Activity, FileText, Server, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const studentNav = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Floors', path: '/floors', icon: Layers },
    { name: 'Washing Machine', path: '/washing-machine', icon: SettingsIcon },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'History', path: '/history', icon: History },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const adminNav = [
    { name: 'Dashboard', path: '/admin', icon: Home },
    { name: 'Live Queues', path: '/admin/live-queues', icon: Activity },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Resources', path: '/admin/resources', icon: Server },
    { name: 'Analytics', path: '/admin/analytics', icon: Activity },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Admins', path: '/admin/manage-admins', icon: Shield },
  ];

  const navigation = user?.role === 'admin' ? adminNav : studentNav;

  return (
    <div className="h-screen w-full overflow-hidden bg-background text-foreground flex flex-col md:flex-row font-['Outfit'] relative">
      <div className="bg-noise"></div>
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-blob"></div>
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>
      {/* Mobile Header */}
      <div className="md:hidden glass p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-gradient">QFlow</h1>
        <button onClick={logout} className="p-2 bg-card rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 w-full md:relative md:w-64 glass md:border-r md:border-t-0 border-t border-border md:h-screen z-50 flex md:flex-col md:p-6 justify-between items-center md:items-start transition-all md:overflow-y-auto bg-card/10">
        <div className="hidden md:block mb-10 w-full">
          <h1 className="text-3xl font-extrabold text-gradient mb-2">QFlow</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{user?.role} Portal</p>
        </div>

        <ul className="flex md:flex-col w-full justify-around md:justify-start gap-2 p-2 md:p-0 relative z-10">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name} className="md:w-full">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <Link 
                    to={item.path} 
                    className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 p-2 md:p-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary border-l-2 border-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon size={isActive ? 24 : 20} className="md:w-6 md:h-6" />
                    <span className={`text-[10px] md:text-base font-medium ${isActive ? 'block' : 'block md:block'}`}>
                      {item.name}
                    </span>
                  </Link>
                </motion.div>
              </li>
            );
          })}
        </ul>

        <div className="hidden md:block w-full mt-auto relative z-20">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors relative z-20"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative z-10">
        <div className="relative z-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
