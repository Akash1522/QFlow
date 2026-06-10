import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layers, Edit2, Trash2 } from 'lucide-react';

const ManageFloors = () => {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFloors = async () => {
      try {
        const res = await axios.get('/floors');
        setFloors(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFloors();
  }, []);

  if (loading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold mb-2">Manage Floors</h2>
            <p className="text-gray-400">Add, edit or remove hostel floors</p>
        </div>
        <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
            + Add Floor
        </button>
      </div>

      <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-dark-900/50">
              <h3 className="font-bold flex items-center gap-2"><Layers size={18} /> Floor Directory</h3>
          </div>
          <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-dark-900/30 text-gray-400 text-sm">
                          <th className="p-4 font-medium">Floor No.</th>
                          <th className="p-4 font-medium">Name</th>
                          <th className="p-4 font-medium">Washrooms</th>
                          <th className="p-4 font-medium">Status</th>
                          <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {floors.map(floor => (
                          <tr key={floor.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-4 font-bold">{floor.floor_number}</td>
                              <td className="p-4 text-white">{floor.name}</td>
                              <td className="p-4 text-gray-300">{floor.stats?.total || 8}</td>
                              <td className="p-4">
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">Active</span>
                              </td>
                              <td className="p-4 text-right">
                                  <button className="text-primary-400 hover:text-primary-300 p-2"><Edit2 size={16} /></button>
                                  <button className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default ManageFloors;
