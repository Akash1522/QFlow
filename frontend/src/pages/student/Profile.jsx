import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Home, Key, Lock, X, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import WebcamModal from '../../components/profile/WebcamModal';
import ImageCropperModal from '../../components/profile/ImageCropperModal';

const Profile = () => {
  const { user, logout } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profilePic, setProfilePic] = useState(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
          toast.error("Image must be smaller than 5MB");
          return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          toast.error("Only JPG, PNG and WEBP formats are allowed");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
        setShowPhotoMenu(false);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWebcamCapture = (dataUrl) => {
      setTempImage(dataUrl);
      setShowWebcam(false);
      setShowCropper(true);
  };

  const handleCropComplete = (croppedImage) => {
      setProfilePic(croppedImage);
      setShowCropper(false);
      setTempImage(null);
      toast.success("Profile picture updated successfully!");
  };

  const removePhoto = () => {
    setProfilePic(null);
    setShowPhotoMenu(false);
    toast.info("Profile picture removed");
  };

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }

    setIsLoading(true);
    try {
      const res = await axios.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success(res.data.message || 'Password changed successfully!');
      setIsChangingPassword(false);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Force logout for session security
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative py-12">
        {/* Massive Abstract Background Typography */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12vw] font-black text-primary/5 whitespace-nowrap pointer-events-none select-none tracking-tighter mix-blend-overlay z-0">
            {user?.name?.toUpperCase()}
        </div>

        {/* Central Glowing Orb Avatar */}
        <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 1 }}
            className="relative z-50 mb-10 group mx-auto w-fit"
        >
            <div className="absolute inset-0 bg-primary/40 blur-[100px] rounded-full group-hover:bg-secondary/40 transition-colors duration-700 pointer-events-none"></div>
            
            {/* Tightly Constrained Wrapper */}
            <div className="relative w-40 h-40">
                <div className="w-full h-full rounded-full border border-primary/30 bg-background/50 backdrop-blur-2xl flex items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(var(--primary),0.2)]">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10"></div>
                    <div className="absolute inset-2 border border-primary/20 rounded-full border-dashed animate-spin-slow"></div>
                    
                    {profilePic ? (
                        <img src={profilePic} alt="Profile" className="w-full h-full object-cover relative z-10" />
                    ) : (
                        <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary relative z-10">
                            {user?.name?.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                
                {/* Interactive Profile Pic Symbol & Menu */}
                <div className="absolute bottom-0 right-0 z-30 translate-x-2 translate-y-2">
                    <button 
                        onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                        title="Update Profile Picture"
                        className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:scale-110 active:scale-95 transition-all border-4 border-background group-hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                    >
                        <Camera size={20} />
                    </button>
                    
                    <AnimatePresence>
                        {showPhotoMenu && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                className="absolute top-14 right-0 w-48 glass-card p-2 border border-border shadow-2xl rounded-xl z-50 text-left"
                            >
                                <button onClick={() => { fileInputRef.current.click(); setShowPhotoMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
                                    <ImageIcon size={16} /> Choose from Gallery
                                </button>
                                <button onClick={() => { setShowPhotoMenu(false); setShowWebcam(true); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
                                    <Camera size={16} /> Take Photo
                                </button>
                                {profilePic && (
                                    <>
                                        <div className="h-px bg-border my-1"></div>
                                        <button onClick={removePhoto} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                                            <Trash2 size={16} /> Remove Photo
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Hidden File Input */}
                    <input type="file" accept="image/jpeg, image/png, image/webp" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                </div>
            </div>
        </motion.div>
        {/* User Details - Floating Holographic Tags */}
        <div className="flex flex-col items-center gap-8 z-10 w-full max-w-4xl">
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-6xl font-black text-foreground tracking-tight text-center drop-shadow-2xl"
            >
                {user?.name}
            </motion.h2>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap justify-center gap-4"
            >
                <div className="px-6 py-2.5 rounded-full glass-card flex items-center gap-3 border-primary/30 hover:border-primary/60 transition-colors shadow-lg">
                    <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_12px_rgba(34,197,94,1)] animate-pulse"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{user?.role} Access</span>
                </div>
                <div className="px-6 py-2.5 rounded-full glass-card flex items-center gap-3 border-primary/30 hover:border-primary/60 transition-colors shadow-lg">
                    <Mail size={16} className="text-primary"/>
                    <span className="text-sm font-medium text-foreground tracking-wide">{user?.email}</span>
                </div>
                <div className="px-6 py-2.5 rounded-full glass-card flex items-center gap-3 border-primary/30 hover:border-primary/60 transition-colors shadow-lg">
                    <Home size={16} className="text-secondary"/>
                    <span className="text-sm font-medium text-foreground tracking-wide">Room {user?.roomNumber || 'N/A'}</span>
                </div>
            </motion.div>

            {/* Interactive Security Node */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full mt-10"
            >
                {!isChangingPassword ? (
                    <button 
                        onClick={() => setIsChangingPassword(true)}
                        className="w-full glass-card p-6 flex flex-col md:flex-row items-center justify-center gap-4 hover:bg-primary/5 hover:border-primary/50 transition-all group cursor-pointer border border-border"
                    >
                        <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all">
                            <Lock size={24} />
                        </div>
                        <span className="text-xl font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                            Initiate Security Override (Update Password)
                        </span>
                    </button>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full glass-card p-8 border-secondary/40 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-[80px] rounded-full pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary flex items-center gap-3 uppercase tracking-wider">
                                <Key size={28} className="text-secondary" />
                                Security Override Protocol
                            </h3>
                            <button onClick={() => setIsChangingPassword(false)} className="text-muted-foreground hover:text-destructive transition-colors p-2 bg-background/50 rounded-lg hover:bg-destructive/10 border border-transparent hover:border-destructive/30">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-6 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-secondary font-bold flex items-center gap-2">
                                        <div className="w-1 h-1 bg-secondary rounded-full"></div> Current Auth Key
                                    </label>
                                    <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handleChange} required className="w-full bg-background/40 backdrop-blur-sm border border-border rounded-lg px-4 py-3.5 text-foreground focus:outline-none focus:border-secondary focus:bg-background/80 transition-colors font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans" placeholder="Enter current password" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-secondary font-bold flex items-center gap-2">
                                        <div className="w-1 h-1 bg-secondary rounded-full"></div> New Auth Key
                                    </label>
                                    <input type="password" name="newPassword" value={passwords.newPassword} onChange={handleChange} required className="w-full bg-background/40 backdrop-blur-sm border border-border rounded-lg px-4 py-3.5 text-foreground focus:outline-none focus:border-secondary focus:bg-background/80 transition-colors font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans" placeholder="Enter new password" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-secondary font-bold flex items-center gap-2">
                                        <div className="w-1 h-1 bg-secondary rounded-full"></div> Verify Auth Key
                                    </label>
                                    <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange} required className="w-full bg-background/40 backdrop-blur-sm border border-border rounded-lg px-4 py-3.5 text-foreground focus:outline-none focus:border-secondary focus:bg-background/80 transition-colors font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans" placeholder="Confirm new password" />
                                </div>
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={isLoading || !passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword} 
                                className="w-full py-4 mt-4 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary font-black uppercase tracking-widest rounded-lg transition-all flex justify-center items-center shadow-[inset_0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[inset_0_0_30px_rgba(6,182,212,0.3),0_0_20px_rgba(6,182,212,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <div className="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"></div> : 'Execute Protocol'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </motion.div>
        </div>

        {/* Profile Modals */}
        <WebcamModal 
            isOpen={showWebcam} 
            onClose={() => setShowWebcam(false)} 
            onCapture={handleWebcamCapture} 
        />
        
        <ImageCropperModal 
            isOpen={showCropper} 
            imageSrc={tempImage} 
            onClose={() => { setShowCropper(false); setTempImage(null); }} 
            onCropComplete={handleCropComplete} 
        />
    </div>
  );
};

export default Profile;
