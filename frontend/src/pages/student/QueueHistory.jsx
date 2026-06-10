import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { History, CheckCircle, XCircle } from 'lucide-react';

const QueueHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('/history');
        setHistory(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
          <History size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Queue History</h2>
          <p className="text-muted-foreground">Past washroom and laundry queues</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.length === 0 ? (
            <div className="col-span-full glass-card p-10 text-center text-muted-foreground">
                No history found.
            </div>
        ) : (
            history.map((record) => (
                <div key={record.id} className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden transition-all hover:-translate-y-1">
                    {/* Decorative Background Glow based on status */}
                    <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full pointer-events-none ${record.status === 'completed' ? 'bg-success/20' : 'bg-destructive/20'}`}></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h3 className="font-bold text-lg text-foreground capitalize">{record.resource_type.replace('_', ' ')}</h3>
                            <p className="text-sm text-muted-foreground">{record.resource_name || `ID: ${record.resource_id}`}</p>
                        </div>
                        {record.status === 'completed' ? (
                            <span className="flex items-center gap-1.5 text-success text-[10px] uppercase tracking-wider font-bold bg-success/10 px-2.5 py-1 rounded-full border border-success/30 shadow-[0_0_10px_rgba(22,163,74,0.2)]">
                                <CheckCircle size={12} /> Completed
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-destructive text-[10px] uppercase tracking-wider font-bold bg-destructive/10 px-2.5 py-1 rounded-full border border-destructive/30 shadow-[0_0_10px_rgba(220,38,38,0.2)]">
                                <XCircle size={12} /> Cancelled
                            </span>
                        )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-border/50 grid grid-cols-2 gap-4 relative z-10">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Joined</p>
                            <p className="text-sm font-medium text-foreground">{new Date(record.joined_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Ended</p>
                            <p className="text-sm font-medium text-foreground">{record.completed_at ? new Date(record.completed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}</p>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default QueueHistory;
