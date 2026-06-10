import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, Settings, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';

const AdminDashboard = () => {
  const [data, setData] = useState(null);

  const socket = useSocket();

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/admin/analytics');
      setData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    if(socket) socket.on('queue_update', fetchAnalytics);
    return () => {
        if(socket) socket.off('queue_update', fetchAnalytics);
    }
  }, [socket]);

  const stats = [
    { title: 'Total Students', value: data?.kpis?.totalStudents || 0, icon: Users, color: 'bg-blue-500/20 text-blue-500' },
    { title: 'Active Queues', value: data?.kpis?.activeQueues || 0, icon: Activity, color: 'bg-success/20 text-success' },
    { title: 'Resources Available', value: data?.kpis?.resourcesAvailable || 0, icon: Settings, color: 'bg-purple-500/20 text-purple-500' },
    { title: 'Avg Wait (mins)', value: data?.kpis?.avgWaitTime || 0, icon: Clock, color: 'bg-warning/20 text-warning' },
    { title: "Today's Completed", value: data?.kpis?.todaysCompleted || 0, icon: CheckCircle, color: 'bg-primary/20 text-primary' },
  ];

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
        <p className="text-muted-foreground">System overview and quick metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                  {!data?.recentActivity || data.recentActivity.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No recent activity.</p>
                  ) : data.recentActivity.map(activity => (
                      <div key={activity.id} className="flex items-center gap-4 p-3 bg-background/50 border border-border rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${activity.status === 'completed' ? 'bg-success' : 'bg-primary'}`}></div>
                          <div className="flex-1">
                              <p className="text-sm font-medium">
                                  {activity.user_name} {activity.status === 'waiting' ? 'joined' : activity.status} {activity.resource_type.replace('_', ' ')} queue
                              </p>
                              <p className="text-xs text-muted-foreground">
                                  {new Date(activity.completed_at || activity.joined_at).toLocaleString()}
                              </p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-center items-center text-center">
             <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-border">
                 <span className="text-4xl">🛠️</span>
             </div>
             <h3 className="text-xl font-bold mb-2">System Health: Excellent</h3>
             <p className="text-muted-foreground text-sm mb-6">All systems are running smoothly. Database connections stable.</p>
             <button className="px-6 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors">
                 Generate Report
             </button>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
