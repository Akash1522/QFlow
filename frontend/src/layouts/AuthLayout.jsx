import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const AuthLayout = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      <div className="bg-noise"></div>
      
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[50%] h-[50%] rounded-full bg-primary/15 blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-foreground tracking-tight">
              Welcome to <span className="text-gradient">QFlow</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Smart Queue Management for Hostel Life
            </p>
          </div>
          
          <div className="glass-card p-8">
            <Outlet />
          </div>
        </motion.div>
      </div>
      
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.7, delay: 0.2 }}
           className="w-3/4 max-w-lg aspect-square glass-card flex flex-col items-center justify-center p-8 relative overflow-hidden"
        >
          {/* Abstract AI Illustration Placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 mix-blend-overlay"></div>
          <div className="relative z-10 text-center">
            <div className="w-32 h-32 mx-auto bg-primary/30 rounded-full flex items-center justify-center animate-float mb-6 backdrop-blur-md border border-border">
              <span className="text-5xl">🏢</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">No More Waiting in Line</h3>
            <p className="text-muted-foreground">Join virtual queues for washrooms and washing machines from the comfort of your room.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
