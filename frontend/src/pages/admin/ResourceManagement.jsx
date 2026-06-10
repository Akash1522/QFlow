import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Trash2, Check, X, Settings2, Droplet, CheckCircle2, AlertTriangle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const StatusBadge = ({ status, type }) => {
    const statusConfig = {
        available: { color: 'text-success bg-success/10 border-success/20', icon: CheckCircle2, label: 'Available' },
        occupied: { color: 'text-destructive bg-destructive/10 border-destructive/20', icon: XCircle, label: 'Occupied' },
        cleaning: { color: 'text-primary bg-primary/10 border-primary/20', icon: Droplet, label: 'Cleaning' },
        maintenance: { color: 'text-warning bg-warning/10 border-warning/20', icon: AlertTriangle, label: 'Maintenance' },
        running: { color: 'text-destructive bg-destructive/10 border-destructive/20', icon: Settings2, label: 'Running' },
        reserved: { color: 'text-primary bg-primary/10 border-primary/20', icon: Check, label: 'Reserved' },
        out_of_service: { color: 'text-muted-foreground bg-muted-foreground/10 border-muted-foreground/20', icon: AlertCircle, label: 'Out of Service' },
    };

    const config = statusConfig[status] || statusConfig.available;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
            <Icon size={12} />
            {config.label}
        </span>
    );
};

const ResourceManagement = () => {
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterFloor, setFilterFloor] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    
    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState(null);

    // Add Form State
    const [addForm, setAddForm] = useState({
        type: 'washroom',
        floor_id: '',
        identifiers: ''
    });

    const fetchResources = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:5000/api/admin/resources', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFloors(data);
        } catch (error) {
            toast.error('Failed to load resources');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const identifiersArray = addForm.identifiers.split(',').map(i => i.trim()).filter(i => i);
            
            await axios.post('http://localhost:5000/api/admin/resources', {
                type: addForm.type,
                floor_id: addForm.floor_id,
                identifiers: identifiersArray
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success('Resources added successfully');
            setIsAddModalOpen(false);
            setAddForm({ ...addForm, identifiers: '' });
            fetchResources();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add resources');
        }
    };

    const handleStatusChange = async (type, id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/admin/resources/${type}/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Status updated');
            fetchResources(); // Optimistic update could be implemented here
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/admin/resources/${resourceToDelete.type}/${resourceToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Resource deleted');
            setIsDeleteModalOpen(false);
            fetchResources();
        } catch (error) {
            toast.error('Failed to delete resource');
        }
    };

    // Calculate Stats
    const allResources = floors.flatMap(f => [
        ...f.washrooms.map(w => ({ ...w, resType: 'washroom', floorName: f.name })), 
        ...f.washing_machines.map(m => ({ ...m, resType: 'washing_machine', floorName: f.name }))
    ]);

    const stats = {
        total: allResources.length,
        available: allResources.filter(r => r.status === 'available').length,
        maintenance: allResources.filter(r => r.status === 'maintenance' || r.status === 'out_of_service').length,
        active: allResources.filter(r => ['occupied', 'running', 'cleaning', 'reserved'].includes(r.status)).length
    };

    // Filtering logic
    const filteredResources = allResources.filter(r => {
        const matchSearch = (r.name || `Washroom ${r.washroom_number}`).toLowerCase().includes(searchQuery.toLowerCase());
        const matchFloor = filterFloor === 'all' || r.floor_id.toString() === filterFloor;
        const matchType = filterType === 'all' || r.resType === filterType;
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        return matchSearch && matchFloor && matchType && matchStatus;
    });

    if (loading) {
        return <div className="flex h-[80vh] items-center justify-center"><div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Resource Management</h1>
                    <p className="text-muted-foreground mt-1">Add, update, and monitor washrooms and washing machines.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="btn-primary w-auto px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm">
                    <Plus size={18} />
                    Add Resource
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                    <p className="text-sm text-muted-foreground">Total Resources</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-3xl font-bold text-success mt-1">{stats.available}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-sm text-muted-foreground">In Use / Active</p>
                    <p className="text-3xl font-bold text-primary mt-1">{stats.active}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-sm text-muted-foreground">Maintenance</p>
                    <p className="text-3xl font-bold text-warning mt-1">{stats.maintenance}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center z-10 relative">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search resources..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    />
                </div>
                <div className="flex w-full md:w-auto gap-4">
                    <select value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)} className="bg-background/50 border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none flex-1">
                        <option value="all">All Floors</option>
                        {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-background/50 border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none flex-1">
                        <option value="all">All Types</option>
                        <option value="washroom">Washrooms</option>
                        <option value="washing_machine">Washing Machines</option>
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-background/50 border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none flex-1">
                        <option value="all">All Status</option>
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="running">Running</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="reserved">Reserved</option>
                    </select>
                </div>
            </div>

            {/* Resource Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredResources.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground glass-card">
                        <Filter className="mx-auto mb-3 opacity-50" size={32} />
                        <p>No resources found matching your filters.</p>
                    </div>
                ) : (
                    filteredResources.map((res) => (
                        <div key={`${res.resType}-${res.id}`} className="glass-card p-5 flex flex-col justify-between group">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <StatusBadge status={res.status} type={res.resType} />
                                    <button 
                                        onClick={() => { setResourceToDelete({ id: res.id, type: res.resType }); setIsDeleteModalOpen(true); }}
                                        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <h3 className="font-semibold text-foreground text-lg">
                                    {res.resType === 'washroom' ? `Washroom ${res.washroom_number}` : res.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span> {res.floorName}
                                </p>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-border">
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Change Status</label>
                                <select 
                                    value={res.status}
                                    onChange={(e) => handleStatusChange(res.resType, res.id, e.target.value)}
                                    className="w-full bg-background/50 border border-border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    {res.resType === 'washroom' ? (
                                        <>
                                            <option value="available">Available</option>
                                            <option value="occupied">Occupied</option>
                                            <option value="cleaning">Cleaning</option>
                                            <option value="maintenance">Maintenance</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="available">Available</option>
                                            <option value="running">Running</option>
                                            <option value="reserved">Reserved</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="out_of_service">Out of Service</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Resource Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-md p-6 relative z-10 border border-white/20 shadow-2xl">
                            <button onClick={() => setIsAddModalOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                            <h2 className="text-xl font-bold text-foreground mb-6">Add Resources</h2>
                            <form onSubmit={handleAddSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Resource Type</label>
                                    <select required value={addForm.type} onChange={e => setAddForm({...addForm, type: e.target.value})} className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary">
                                        <option value="washroom">Washroom</option>
                                        <option value="washing_machine">Washing Machine</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Floor</label>
                                    <select required value={addForm.floor_id} onChange={e => setAddForm({...addForm, floor_id: e.target.value})} className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary">
                                        <option value="" disabled>Select a floor</option>
                                        {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        {addForm.type === 'washroom' ? 'Washroom Numbers (Comma separated)' : 'Machine Names (Comma separated)'}
                                    </label>
                                    <input 
                                        required 
                                        type="text" 
                                        value={addForm.identifiers}
                                        onChange={e => setAddForm({...addForm, identifiers: e.target.value})}
                                        placeholder={addForm.type === 'washroom' ? 'e.g. 9, 10, 11' : 'e.g. Machine A, Machine B'}
                                        className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Supports bulk adding multiple resources at once.</p>
                                </div>
                                <button type="submit" className="btn-primary mt-2">Save Resources</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-sm p-6 relative z-10 border border-destructive/20 shadow-2xl text-center">
                            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={24} />
                            </div>
                            <h2 className="text-lg font-bold text-foreground mb-2">Delete Resource</h2>
                            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to permanently delete this resource? This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium">Cancel</button>
                                <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-white transition-colors text-sm font-medium shadow-[0_0_15px_rgba(var(--destructive),0.4)]">Delete</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResourceManagement;
