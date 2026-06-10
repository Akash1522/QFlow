import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const socket = useSocket();

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/admin/analytics');
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    if(socket) socket.on('queue_update', fetchAnalytics);
    return () => {
      if(socket) socket.off('queue_update', fetchAnalytics);
    }
  }, [socket]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-64 bg-card rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-card rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="h-80 bg-card rounded-xl"></div>
             <div className="h-80 bg-card rounded-xl"></div>
             <div className="h-80 bg-card rounded-xl"></div>
             <div className="h-80 bg-card rounded-xl"></div>
        </div>
      </div>
    );
  }

  const { kpis, charts, recentActivity } = data || {};

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center">
          <Activity size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive overview of system usage and queue metrics</p>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-t-4 border-t-primary">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-muted-foreground text-sm">Total Queue Requests</h3>
            <Activity size={20} className="text-primary" />
          </div>
          <p className="text-4xl font-bold text-foreground">{kpis?.totalRequests || 0}</p>
        </div>
        
        <div className="glass-card p-6 border-t-4 border-t-success">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-muted-foreground text-sm">Active Queue Entries</h3>
            <TrendingUp size={20} className="text-success" />
          </div>
          <p className="text-4xl font-bold text-foreground">{kpis?.activeQueues || 0}</p>
        </div>
        
        <div className="glass-card p-6 border-t-4 border-t-purple-500">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-muted-foreground text-sm">Completed Requests</h3>
            <CheckCircle size={20} className="text-purple-500" />
          </div>
          <p className="text-4xl font-bold text-foreground">{kpis?.completedRequests || 0}</p>
        </div>
        
        <div className="glass-card p-6 border-t-4 border-t-warning">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-muted-foreground text-sm">Average Wait Time</h3>
            <Clock size={20} className="text-warning" />
          </div>
          <p className="text-4xl font-bold text-foreground">{kpis?.avgWaitTime || 0} <span className="text-lg text-muted-foreground font-normal">min</span></p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6">Queue Activity (Last 7 Days)</h3>
          <div className="h-72">
            {charts?.weeklyActivity?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Legend />
                    <Line type="monotone" dataKey="queues" name="Total Queues" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data available yet</div>
            )}
          </div>
        </div>

        {/* Wait Time Trends (Line Chart) */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6">Average Wait Time Trends</h3>
          <div className="h-72">
            {charts?.waitTimeTrends?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.waitTimeTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Legend />
                    <Line type="monotone" dataKey="avgWait" name="Wait Time (mins)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data available yet</div>
            )}
          </div>
        </div>

        {/* Resource Distribution (Donut Chart) */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6">Resource Usage Distribution</h3>
          <div className="h-72">
            {charts?.resourceDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={charts.resourceDistribution}
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                    >
                    {charts.resourceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data available yet</div>
            )}
          </div>
        </div>

        {/* Peak Usage Hours (Bar Chart) */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6">Peak Usage Hours</h3>
          <div className="h-72">
            {charts?.peakHours?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.peakHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Bar dataKey="count" name="Queues Started" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data available yet</div>
            )}
          </div>
        </div>

        {/* Queue Status Breakdown (Pie Chart) */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6">Queue Status Breakdown</h3>
          <div className="h-72">
            {charts?.statusBreakdown?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={charts.statusBreakdown}
                        outerRadius={90}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                    {charts.statusBreakdown.map((entry, index) => {
                        // Custom colors for status
                        let color = '#888';
                        if (entry.name === 'Waiting') color = '#f59e0b';
                        if (entry.name === 'Active') color = '#3b82f6';
                        if (entry.name === 'Completed') color = '#10b981';
                        if (entry.name === 'Cancelled') color = '#ef4444';
                        return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data available yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-6">Recent Activity Feed</h3>
        <div className="space-y-4">
          {!recentActivity || recentActivity.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded-xl">No recent activity found.</div>
          ) : (
            recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${activity.status === 'completed' ? 'bg-success' : activity.status === 'waiting' ? 'bg-warning' : activity.status === 'active' ? 'bg-primary' : 'bg-destructive'}`}></div>
                  <div>
                    <p className="text-foreground font-medium capitalize">{activity.user_name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{activity.status} • {activity.resource_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                    <span className="text-xs text-muted-foreground block">{new Date(activity.joined_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default Analytics;
