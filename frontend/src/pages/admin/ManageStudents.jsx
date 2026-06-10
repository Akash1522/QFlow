import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Search, Eye, X, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('/admin/students');
        setStudents(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const openHistory = async (student) => {
      setSelectedStudent(student);
      setLoadingHistory(true);
      try {
          const res = await axios.get(`/admin/students/${student.id}/history`);
          setHistory(res.data);
      } catch(error) {
          console.error(error);
          toast.error("Failed to load student history");
      } finally {
          setLoadingHistory(false);
      }
  };

  const filteredStudents = students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.room_number && s.room_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
          <Users size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Manage Students</h2>
          <p className="text-muted-foreground">View and manage registered hostel students</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input 
                type="text" 
                placeholder="Search by name, email, or room..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-foreground outline-none focus:border-primary transition-colors"
            />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/30 text-muted-foreground text-sm">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Room</th>
                <th className="p-4 font-medium">Total Queues</th>
                <th className="p-4 font-medium">Last Activity</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted-foreground">No students found matching your search.</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium text-foreground">{student.name}</td>
                    <td className="p-4 text-muted-foreground">{student.email}</td>
                    <td className="p-4 text-muted-foreground">{student.room_number || '-'}</td>
                    <td className="p-4 text-muted-foreground font-bold">{student.total_queues || 0}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                        {student.last_activity ? new Date(student.last_activity).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openHistory(student)} className="text-primary hover:text-primary/80 p-2 bg-primary/10 rounded-lg transition-colors" title="View History">
                          <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-border flex justify-between items-center bg-card">
                      <div>
                          <h3 className="text-xl font-bold">{selectedStudent.name}'s History</h3>
                          <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                      </div>
                      <button onClick={() => setSelectedStudent(null)} className="p-2 text-muted-foreground hover:text-foreground bg-muted rounded-lg">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                      {loadingHistory ? (
                          <div className="flex justify-center p-10">
                              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                      ) : history.length === 0 ? (
                          <div className="text-center p-10 text-muted-foreground">No queue history found for this student.</div>
                      ) : (
                          <div className="space-y-4">
                              {history.map(item => (
                                  <div key={item.id} className="flex justify-between items-center p-4 bg-card rounded-xl border border-border">
                                      <div className="flex items-center gap-4">
                                          <div className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-success' : item.status === 'cancelled' ? 'bg-destructive' : 'bg-primary'}`}></div>
                                          <div>
                                              <p className="font-medium capitalize">{item.resource_type.replace('_', ' ')}</p>
                                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                  <Clock size={12} /> {new Date(item.joined_at).toLocaleString()}
                                              </p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <span className={`px-2 py-1 text-xs rounded-full border ${item.status === 'completed' ? 'bg-success/20 text-success border-success/30' : 'bg-destructive/20 text-destructive border-destructive/30'}`}>
                                              {item.status}
                                          </span>
                                          {item.duration > 0 && <p className="text-xs text-muted-foreground mt-2">{item.duration} mins</p>}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ManageStudents;
