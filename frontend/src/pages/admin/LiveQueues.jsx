import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Clock, FastForward, CheckCircle, XCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'react-toastify';

const LiveQueues = () => {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchLiveQueues = async () => {
    try {
      const res = await axios.get('/admin/live-queues');
      setQueues(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
        await axios.put(`/admin/live-queues/${id}/action`, { action });
        toast.success(`Action '${action}' executed successfully.`);
    } catch (error) {
        console.error(error);
        toast.error(`Failed to execute '${action}'.`);
    }
  };

  useEffect(() => {
    fetchLiveQueues();
    if(socket) {
        socket.on('queue_update', fetchLiveQueues);
    }
    return () => {
        if(socket) socket.off('queue_update', fetchLiveQueues);
    }
  }, [socket]);

  if (loading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-success/20 text-success flex items-center justify-center">
          <Activity size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Live Queues</h2>
          <p className="text-muted-foreground">Monitor all active and waiting students across the hostel</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/30 text-muted-foreground text-sm">
                <th className="p-4 font-medium">Student Name</th>
                <th className="p-4 font-medium">Room</th>
                <th className="p-4 font-medium">Resource</th>
                <th className="p-4 font-medium">Position</th>
                <th className="p-4 font-medium">Est. Wait</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Joined At</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queues.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted-foreground">No active queues right now.</td>
                </tr>
              ) : (
                queues.map((q) => (
                  <tr key={q.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium text-foreground">{q.student_name}</td>
                    <td className="p-4 text-muted-foreground">{q.room_number || '-'}</td>
                    <td className="p-4 text-muted-foreground capitalize">
                        {q.resource_type.replace('_', ' ')} (ID: {q.resource_id})
                    </td>
                    <td className="p-4 text-muted-foreground font-bold">{q.position === 0 ? '-' : `#${q.position}`}</td>
                    <td className="p-4 text-muted-foreground">{q.estimated_wait_time} mins</td>
                    <td className="p-4">
                        <span className={`flex items-center gap-2 w-max px-2 py-1 text-xs rounded-full border ${q.status === 'active' ? 'bg-success/20 text-success border-success/30' : 'bg-warning/20 text-warning border-warning/30'}`}>
                            {q.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>}
                            {q.status}
                        </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                        <Clock size={14} /> {new Date(q.joined_at).toLocaleTimeString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                        {q.status === 'waiting' && (
                            <button onClick={() => handleAction(q.id, 'skip')} className="text-yellow-400 hover:text-yellow-300 p-2 bg-yellow-500/10 rounded-lg transition-colors" title="Skip/Delay">
                                <FastForward size={16} />
                            </button>
                        )}
                        <button onClick={() => handleAction(q.id, 'complete')} className="text-success hover:text-success/80 p-2 bg-success/10 rounded-lg transition-colors" title="Force Complete">
                            <CheckCircle size={16} />
                        </button>
                        <button onClick={() => handleAction(q.id, 'remove')} className="text-destructive hover:text-destructive/80 p-2 bg-destructive/10 rounded-lg transition-colors" title="Remove">
                            <XCircle size={16} />
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LiveQueues;
