import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { motion } from 'framer-motion';
import { Clock, Users, PlayCircle, Settings, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const WashingMachineQueue = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null); // store ID of machine joining
  const socket = useSocket();
  const navigate = useNavigate();

  const fetchMachineStatus = async () => {
    try {
      const res = await axios.get('/queues/washing-machine');
      setMachines(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load washing machine data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachineStatus();

    if (socket) {
      socket.on('queue_update', (data) => {
        if(data.resourceType === 'washing_machine') {
            fetchMachineStatus();
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('queue_update');
      }
    };
  }, [socket]);

  const handleJoinQueue = async (machineId) => {
    setJoining(machineId);
    try {
      await axios.post('/queues/join', {
        resourceType: 'washing_machine',
        resourceId: machineId
      });
      toast.success('Successfully joined the laundry queue!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join queue');
    } finally {
      setJoining(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (machines.length === 0) {
    return <div className="text-center text-muted-foreground mt-10">No washing machines found.</div>;
  }

  const getStatusIcon = (status) => {
    switch(status) {
        case 'available': return <CheckCircle size={48} className="text-success" />;
        case 'running': return <PlayCircle size={48} className="text-warning animate-spin-slow" />;
        case 'reserved': return <Clock size={48} className="text-primary" />;
        case 'maintenance': return <Settings size={48} className="text-destructive animate-spin-slow" />;
        case 'out_of_service': return <Settings size={48} className="text-muted-foreground" />;
        default: return <CheckCircle size={48} className="text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-2">Laundry Room</h2>
        <p className="text-muted-foreground">Hostel Mega Washers Status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {machines.map((machine) => (
            <motion.div 
                key={machine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card p-6 md:p-8 relative overflow-hidden flex flex-col ${machine.status === 'maintenance' ? 'opacity-70 border-destructive/20' : ''}`}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="flex flex-col items-center gap-6 relative z-10 flex-1">
                    {/* Visual Rep */}
                    <div className="w-40 h-56 bg-background border border-border rounded-3xl relative flex items-center justify-center shadow-2xl flex-shrink-0">
                        <div className="absolute inset-2 border border-border/50 rounded-2xl"></div>
                        <div className="w-24 h-24 rounded-full border-4 border-border bg-card flex items-center justify-center overflow-hidden relative">
                            {machine.status === 'running' && (
                                <div className="absolute inset-0 bg-blue-500/20 animate-spin opacity-50"></div>
                            )}
                            <div className="z-10 bg-background/80 rounded-full p-2">
                                {getStatusIcon(machine.status)}
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col flex-1 w-full space-y-6">
                        <div className="text-center">
                            <div className="flex flex-col items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold">{machine.name}</h3>
                                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
                                    machine.status === 'available' ? 'bg-success/20 text-success border-success/30' :
                                    machine.status === 'running' ? 'bg-warning/20 text-warning border-warning/30' :
                                    machine.status === 'reserved' ? 'bg-primary/20 text-primary border-primary/30' :
                                    'bg-destructive/20 text-destructive border-destructive/30'
                                }`}>
                                    {machine.status}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">Floor {machine.floor_id} • Cycle time approx. 45 mins</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-auto">
                            <div className="bg-background/50 p-3 rounded-xl border border-border text-center">
                                <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                                    <Users size={14} /> Waiting
                                </div>
                                <div className="text-xl font-bold text-foreground">{machine.queue_length}</div>
                            </div>
                            <div className="bg-background/50 p-3 rounded-xl border border-border text-center">
                                <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                                    <Clock size={14} /> Est. Wait
                                </div>
                                <div className="text-xl font-bold text-foreground">{machine.estimated_wait_time} <span className="text-xs font-normal text-muted-foreground">min</span></div>
                            </div>
                        </div>

                        <div className="mt-auto pt-4">
                            {['maintenance', 'out_of_service'].includes(machine.status) ? (
                                <div className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center bg-muted text-destructive border border-destructive/20">
                                    {machine.status === 'maintenance' ? 'Under Maintenance' : 'Out of Service'}
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleJoinQueue(machine.id)}
                                    disabled={joining === machine.id}
                                    className="btn-primary py-3"
                                >
                                    {joining === machine.id ? (
                                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                                    ) : (
                                        'Join Queue'
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        ))}
      </div>
    </div>
  );
};

export default WashingMachineQueue;
