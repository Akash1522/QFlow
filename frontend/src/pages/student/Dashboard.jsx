import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, Activity, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [queueStatus, setQueueStatus] = useState({ inQueue: false });
  const [loading, setLoading] = useState(true);

  const fetchQueueStatus = async () => {
    try {
      const res = await axios.get('/queues/status');
      setQueueStatus(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    
    if (socket) {
      socket.on('queue_update', () => {
        fetchQueueStatus();
      });
    }
    
    return () => {
      if (socket) {
        socket.off('queue_update');
      }
    };
  }, [socket]);

  const handleLeaveQueue = async () => {
    try {
      await axios.post('/queues/leave');
      toast.success('Left the queue');
      fetchQueueStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error leaving queue');
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div>
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, <span className="text-gradient">{user?.name}</span> 👋
          </h2>
          <p className="text-muted-foreground">Room: {user?.roomNumber} • Ready to manage your time?</p>
        </div>
        <div className="hidden md:block w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-border">
           <span className="text-5xl">🎓</span>
        </div>
      </motion.div>

      {/* Active Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity className="text-primary" /> Current Activity
            </h3>
            {queueStatus.inQueue && (
              <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full animate-pulse border border-primary/30">
                ACTIVE
              </span>
            )}
          </div>
          
          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-32 w-full rounded-xl"></div>
              <div className="skeleton h-12 w-full rounded-xl mt-4"></div>
            </div>
          ) : queueStatus.inQueue ? (
            <div className="space-y-4">
              <div className="p-4 bg-background/50 rounded-xl border border-border flex flex-col items-center justify-center text-center">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                  Queue for {queueStatus.queueInfo.resource_type === 'washroom' ? 'Washroom' : 'Washing Machine'}
                </p>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-primary my-2">
                  Token #{queueStatus.queueInfo.token_number}
                </div>
                <div className="flex items-center gap-2 text-primary mt-2 bg-primary/10 px-4 py-2 rounded-lg">
                  <Clock size={16} />
                  <span className="font-medium">Queue Position: {queueStatus.position} • Est. Wait: {queueStatus.estimatedWaitTime} mins</span>
                </div>
              </div>
              
              <button 
                onClick={handleLeaveQueue}
                className="w-full py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(var(--destructive),0.15)]"
              >
                <CheckCircle size={18} />
                I'm Done / Leave Queue
              </button>
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed border-border rounded-xl bg-background/30">
              <CheckCircle className="mx-auto text-success mb-3" size={32} />
              <p className="text-muted-foreground mb-4">You are not currently in any queue.</p>
              <div className="flex gap-4 justify-center">
                <Link to="/floors" className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-colors">
                  Find Washroom
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <Link to="/floors" className="glass-card p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors group cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🚿</span>
            </div>
            <h4 className="font-bold mb-1">Washrooms</h4>
            <p className="text-xs text-muted-foreground">View status & join queues</p>
          </Link>
          
          <Link to="/washing-machine" className="glass-card p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors group cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🧺</span>
            </div>
            <h4 className="font-bold mb-1">Laundry</h4>
            <p className="text-xs text-muted-foreground">Check machine status</p>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
