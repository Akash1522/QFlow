import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import WashroomStatusBadge from '../../components/WashroomStatusBadge';
import WashroomStatusLegend from '../../components/WashroomStatusLegend';

const WashroomQueue = () => {
  const { floorId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [washrooms, setWashrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);

  const fetchWashrooms = async () => {
    try {
      const res = await axios.get(`/floors/${floorId}/washrooms`);
      setWashrooms(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load washrooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWashrooms();

    if (socket) {
      socket.emit('join_floor', floorId);
      
      socket.on('queue_update', () => {
        fetchWashrooms();
      });
    }

    return () => {
      if (socket) {
        socket.emit('leave_floor', floorId);
        socket.off('queue_update');
      }
    };
  }, [floorId, socket]);

  const handleJoinQueue = async (washroomId) => {
    setJoiningId(washroomId);
    try {
      await axios.post('/queues/join', {
        resourceType: 'washroom',
        resourceId: washroomId
      });
      toast.success('Successfully joined the queue!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join queue');
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/floors')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft size={20} /> Back to Floors
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-bold">Washroom Status</h2>
        <p className="text-muted-foreground">View real-time availability and join queues</p>
      </div>

      <WashroomStatusLegend />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {washrooms.map((wr, index) => (
          <motion.div
            key={wr.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card p-6 flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Washroom {wr.washroom_number}</h3>
              <WashroomStatusBadge status={wr.status} />
            </div>
            
            <div className="flex-1 space-y-4 my-4">
              <div className="flex items-center justify-between p-3 bg-background/50 border border-border rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Users size={16} /> In Queue
                </div>
                <span className="font-bold">{wr.queue_length}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-background/50 border border-border rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock size={16} /> Est. Wait
                </div>
                <span className="font-bold">{wr.estimated_wait_time} min</span>
              </div>
            </div>

            <button
              onClick={() => handleJoinQueue(wr.id)}
              disabled={!wr.is_active || wr.status === 'maintenance' || joiningId === wr.id}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center transition-all ${
                !wr.is_active || wr.status === 'maintenance'
                  ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(var(--primary),0.3)]'
              }`}
            >
              {joiningId === wr.id ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              ) : (
                'Join Queue'
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default WashroomQueue;
