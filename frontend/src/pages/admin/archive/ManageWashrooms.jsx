import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import WashroomStatusBadge from '../../components/WashroomStatusBadge';
import WashroomStatusLegend from '../../components/WashroomStatusLegend';

const ManageWashrooms = () => {
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState('');
  const [washrooms, setWashrooms] = useState([]);
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

  const loadWashrooms = async () => {
      if(!selectedFloor) return;
      try {
          const res = await axios.get(`/floors/${selectedFloor}/washrooms`);
          setWashrooms(res.data);
      } catch(error) {
          console.error(error);
          toast.error("Error loading washrooms");
      }
  }

  if (loading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Manage Washrooms</h2>
        <p className="text-gray-400">Update status for maintenance or cleaning</p>
      </div>

      <WashroomStatusLegend />

      <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-dark-900 border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-xl">
              <span className="text-4xl">🚿</span>
          </div>
          <h3 className="text-2xl font-bold mb-2">Washroom Management</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
              Select a floor from the dropdown below to manage individual washroom statuses.
          </p>
          <div className="flex gap-4 mb-8">
              <select 
                value={selectedFloor} 
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="px-4 py-2 bg-dark-900 border border-white/10 rounded-lg text-white outline-none focus:border-primary-500"
              >
                  <option value="">Select Floor...</option>
                  {floors.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
              </select>
              <button 
                onClick={loadWashrooms}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                  Load Washrooms
              </button>
          </div>
      </div>

      {washrooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {washrooms.map(wr => (
                  <div key={wr.id} className="glass-card p-4">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold">Washroom {wr.washroom_number}</h4>
                          <WashroomStatusBadge status={wr.status} />
                      </div>
                      <select className="w-full bg-dark-900 border border-white/10 rounded p-2 text-sm text-gray-300">
                          <option selected={wr.status === 'available'}>Available</option>
                          <option selected={wr.status === 'occupied'}>Occupied</option>
                          <option selected={wr.status === 'cleaning'}>Cleaning</option>
                          <option selected={wr.status === 'maintenance'}>Maintenance</option>
                      </select>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default ManageWashrooms;
