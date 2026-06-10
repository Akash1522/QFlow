import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Shield, Trash2, Download, AlertTriangle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManageAdmins = () => {
    const { user } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Create Admin State
    const [formData, setFormData] = useState({ name: '', email: '', password: '', otp: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Danger Zone State
    const [showDangerModal, setShowDangerModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    const fetchAdmins = async () => {
        try {
            const res = await axios.get('/admin/admins');
            setAdmins(res.data);
        } catch (error) {
            toast.error('Failed to fetch admins');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    useEffect(() => {
        let timer;
        if (resendTimer > 0) {
            timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);

    // Reset OTP state if user edits the main form fields
    useEffect(() => {
        setOtpSent(false);
        setResendTimer(0);
        setFormData(prev => ({ ...prev, otp: '' }));
    }, [formData.name, formData.email, formData.password]);

    const handleSendOtp = async () => {
        setIsSendingOtp(true);
        try {
            const res = await axios.post('/admin/admins/send-otp');
            toast.success(res.data.message || 'OTP Sent successfully');
            setOtpSent(true);
            setResendTimer(30); // 30 second cooldown
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        if (!otpSent || !formData.otp) {
            toast.error('Please request and enter an OTP to authorize this action');
            return;
        }
        setIsCreating(true);
        try {
            await axios.post('/admin/admins', formData);
            toast.success('Admin created successfully');
            setFormData({ name: '', email: '', password: '', otp: '' });
            setOtpSent(false);
            fetchAdmins();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create admin');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (!window.confirm('Are you sure you want to delete this admin account?')) return;
        try {
            await axios.delete(`/admin/admins/${id}`);
            toast.success('Admin deleted successfully');
            fetchAdmins();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete admin');
        }
    };

    const handleExportStudents = async () => {
        try {
            const res = await axios.get('/admin/students');
            const students = res.data;
            if (students.length === 0) return toast.info('No students to export');

            const headers = ['ID', 'Name', 'Email', 'Room', 'Total Queues'];
            const csvContent = [
                headers.join(','),
                ...students.map(s => `"${s.id}","${s.name}","${s.email}","${s.room_number}","${s.total_queues}"`)
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `students-export-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Log the action
            await axios.post('/admin/logs/export-csv', {}, { validateStatus: () => true }); // Dummy endpoint if logs are needed
            toast.success('Students exported successfully');
        } catch (error) {
            toast.error('Failed to export students');
        }
    };

    const handleDeleteAllStudents = async () => {
        if (confirmText !== 'DELETE ALL STUDENTS') {
            toast.error('Confirmation text does not match');
            return;
        }
        setIsDeletingAll(true);
        try {
            await axios.delete('/admin/students/all');
            toast.success('All student records have been permanently deleted');
            setShowDangerModal(false);
            setConfirmText('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete students');
        } finally {
            setIsDeletingAll(false);
        }
    };

    if (loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                    <Shield size={24} />
                </div>
                <div>
                    <h2 className="text-3xl font-bold">Manage Admins</h2>
                    <p className="text-muted-foreground">Add or remove system administrators securely.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Admin List */}
                <div className={`space-y-4 ${user.email === 'acash.mailhub@gmail.com' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    <h3 className="text-xl font-bold mb-4">Current Administrators</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {admins.map(admin => (
                            <div key={admin.id} className="glass-card p-6 flex justify-between items-center border border-border/50">
                                <div>
                                    <h4 className="font-bold text-lg">{admin.name}</h4>
                                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                                    {admin.id === user.id && <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary/20 text-primary rounded-md font-medium">You</span>}
                                    {admin.email === 'acash.mailhub@gmail.com' && admin.id !== user.id && <span className="inline-block mt-2 ml-2 px-2 py-1 text-xs bg-amber-500/20 text-amber-500 rounded-md font-medium">Super Admin</span>}
                                </div>
                                {user.email === 'acash.mailhub@gmail.com' && admin.id !== user.id && (
                                    <button 
                                        onClick={() => handleDeleteAdmin(admin.id)}
                                        className="p-3 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive hover:text-white transition-colors"
                                        title="Delete Admin"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Create Admin Form */}
                {user.email === 'acash.mailhub@gmail.com' && (
                    <div className="glass-card p-6 h-fit border border-border/50">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus size={20}/> Create Admin</h3>
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input 
                                    type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:border-primary transition-colors"
                                    placeholder="Admin Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input 
                                    type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:border-primary transition-colors"
                                    placeholder="admin@domain.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Password</label>
                                <input 
                                    type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                                    className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:border-primary transition-colors"
                                    placeholder="Secure password"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Authorization OTP</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" required={otpSent} disabled={!otpSent} value={formData.otp} onChange={e => setFormData({...formData, otp: e.target.value})}
                                        className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:border-primary transition-colors disabled:opacity-50 font-mono"
                                        placeholder="000000"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={isSendingOtp || resendTimer > 0 || (!formData.name || !formData.email || !formData.password)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                                            resendTimer > 0 || (!formData.name || !formData.email || !formData.password)
                                                ? 'bg-secondary/50 text-secondary-foreground/50 cursor-not-allowed' 
                                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                        }`}
                                    >
                                        {isSendingOtp ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    An OTP will be sent to the Super Admin (<strong>{user.email}</strong>) to authorize this action.
                                </p>
                            </div>
                            <button 
                                type="submit" disabled={isCreating || !otpSent || !formData.otp}
                                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                {isCreating ? 'Creating...' : 'Create Admin'}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div className="mt-12 border border-destructive/30 bg-destructive/5 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4 text-destructive">
                    <AlertTriangle size={24} />
                    <h3 className="text-xl font-bold">Danger Zone</h3>
                </div>
                <p className="text-muted-foreground mb-6 max-w-2xl">
                    These actions are destructive and cannot be undone. You can export student records as a CSV backup before permanently wiping all student accounts and their associated queue history from the database.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={handleExportStudents}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-card hover:bg-muted border border-border text-foreground font-bold rounded-xl transition-all"
                    >
                        <Download size={18} /> Export Students CSV
                    </button>
                    <button 
                        onClick={() => setShowDangerModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-destructive hover:bg-destructive/90 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                    >
                        <Trash2 size={18} /> Wipe All Students
                    </button>
                </div>
            </div>

            {/* Danger Modal */}
            <AnimatePresence>
                {showDangerModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-destructive/30 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-4 text-destructive">
                                <AlertTriangle size={28} />
                                <h3 className="text-xl font-bold">Absolute Confirmation</h3>
                            </div>
                            <p className="text-muted-foreground mb-4">
                                This will permanently delete <strong>EVERY</strong> student account and their entire queue history. It cannot be recovered.
                            </p>
                            <p className="font-bold text-sm mb-2 text-foreground">
                                Type <span className="select-none text-destructive bg-destructive/10 px-2 py-1 rounded">DELETE ALL STUDENTS</span> to confirm:
                            </p>
                            <input 
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:border-destructive transition-colors mb-6 text-foreground font-mono"
                                placeholder=""
                            />
                            <div className="flex gap-3 justify-end">
                                <button 
                                    onClick={() => { setShowDangerModal(false); setConfirmText(''); }}
                                    className="px-4 py-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDeleteAllStudents}
                                    disabled={confirmText !== 'DELETE ALL STUDENTS' || isDeletingAll}
                                    className="px-6 py-2 bg-destructive text-white font-bold rounded-xl hover:bg-destructive/90 disabled:opacity-50 transition-all"
                                >
                                    {isDeletingAll ? 'Wiping...' : 'Confirm Wipe'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageAdmins;
