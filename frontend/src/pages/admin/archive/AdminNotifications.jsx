import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, Check, Clock } from 'lucide-react';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/notifications'); // Admin is also a user, they get system notifications
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

  if (loading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
          <Bell size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold">System Alerts</h2>
          <p className="text-gray-400">Admin notifications and important system messages</p>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="glass-card p-10 text-center text-gray-400">
            No active alerts.
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className={`glass-card p-4 flex gap-4 transition-all ${!notif.is_read ? 'border-red-500/30 bg-red-500/5' : ''}`}>
              <div className="mt-1">
                <div className={`w-2 h-2 rounded-full ${!notif.is_read ? 'bg-red-500' : 'bg-gray-600'}`}></div>
              </div>
              <div className="flex-1">
                <p className={`${!notif.is_read ? 'text-white font-medium' : 'text-gray-300'}`}>{notif.message}</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Clock size={12} /> {new Date(notif.created_at).toLocaleString()}
                </p>
              </div>
              {!notif.is_read && (
                <button onClick={() => markAsRead(notif.id)} className="text-red-400 hover:text-red-300 p-2 h-fit rounded-lg hover:bg-red-500/10 transition-colors">
                  <Check size={18} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
