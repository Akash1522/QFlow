import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, Check, Clock } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/notifications');
        setNotifications(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center">
          <Bell size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Notifications</h2>
          <p className="text-muted-foreground">Your recent updates and alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notifications.length === 0 ? (
          <div className="col-span-full glass-card p-10 text-center text-muted-foreground">
            No notifications found.
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
                key={notif.id} 
                className={`glass-card p-6 flex flex-col gap-4 relative overflow-hidden transition-all ${
                    !notif.is_read ? 'border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'opacity-80 hover:opacity-100'
                }`}
            >
              {!notif.is_read && (
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none"></div>
              )}
              
              <div className="flex justify-between items-start relative z-10">
                <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${!notif.is_read ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]' : 'bg-muted-foreground'}`}></div>
                {!notif.is_read && (
                  <button 
                    onClick={() => markAsRead(notif.id)} 
                    className="text-primary hover:text-primary/80 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
              
              <div className="flex-1 relative z-10">
                <p className={`${!notif.is_read ? 'text-foreground font-semibold' : 'text-muted-foreground'} text-sm leading-relaxed`}>
                    {notif.message}
                </p>
              </div>

              <div className="mt-auto pt-4 border-t border-border/50 relative z-10">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock size={14} /> {new Date(notif.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
