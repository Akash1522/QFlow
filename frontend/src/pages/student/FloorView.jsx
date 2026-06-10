import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Layers, Users, CheckCircle, AlertCircle } from 'lucide-react';
import WashroomStatusBadge from '../../components/WashroomStatusBadge';

const FloorView = () => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
          <Layers size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Select Floor</h2>
          <p className="text-muted-foreground">Choose a floor to view washroom availability</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {floors.map((floor, index) => (
          <motion.div
            key={floor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={`/washrooms/${floor.id}`}>
              <div className="glass-card p-6 hover:border-primary/50 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {floor.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">Floor {floor.floor_number}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground border border-border group-hover:scale-110 transition-transform">
                    {floor.floor_number}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border">
                    <WashroomStatusBadge status="available" />
                    <span className="font-bold text-success">{floor.stats.available || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border">
                    <WashroomStatusBadge status="occupied" />
                    <span className="font-bold text-warning">{floor.stats.occupied || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle size={16} className="text-muted-foreground" /> Total Washrooms
                    </span>
                    <span className="font-bold text-foreground">{floor.stats.total || 8}</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FloorView;
