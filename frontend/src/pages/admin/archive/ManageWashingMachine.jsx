import React, { useEffect, useState } from 'react';
import { Settings, CheckCircle, PlayCircle, Users, Clock } from 'lucide-react';
import axios from 'axios';

const ManageWashingMachine = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const res = await axios.get('/queues/washing-machine');
        setMachines(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, []);

  if (loading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Manage Washing Machine</h2>
        <p className="text-gray-400">Control hostel laundry system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {machines.map(machine => (
            <div key={machine.id} className="glass-card p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold">{machine.name}</h3>
                        <p className="text-gray-400 text-sm">Floor {machine.floor_id}</p>
                    </div>
                    <div className={`p-2 rounded-full border ${
                        machine.status === 'available' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        machine.status === 'running' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                        {machine.status === 'available' ? <CheckCircle size={24} /> :
                         machine.status === 'running' ? <PlayCircle size={24} className="animate-spin-slow" /> :
                         <Settings size={24} className="animate-spin-slow" />}
                    </div>
                </div>

                <div className="space-y-4 mb-8 flex-grow">
                    <div className="flex justify-between items-center p-3 bg-dark-900/50 rounded-lg border border-white/5">
                        <span className="text-gray-400 flex items-center gap-2"><Users size={16} /> Queue Length</span>
                        <span className="font-bold">{machine.queue_length} students</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-dark-900/50 rounded-lg border border-white/5">
                        <span className="text-gray-400 flex items-center gap-2"><Clock size={16} /> Wait Time</span>
                        <span className="font-bold">{machine.estimated_wait_time} mins</span>
                    </div>
                </div>

                <div className="space-y-3 mt-auto">
                    <select className="w-full bg-dark-900 border border-white/10 rounded-xl p-3 text-sm text-gray-300 outline-none focus:border-primary-500">
                        <option value="available" selected={machine.status === 'available'}>Available</option>
                        <option value="running" selected={machine.status === 'running'}>Running</option>
                        <option value="maintenance" selected={machine.status === 'maintenance'}>Maintenance</option>
                    </select>
                    <button className="w-full py-3 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl font-medium transition-colors">
                        Clear Queue
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ManageWashingMachine;
