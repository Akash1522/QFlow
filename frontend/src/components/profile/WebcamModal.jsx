import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WebcamModal = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [error, setError] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);

    useEffect(() => {
        if (isOpen && !capturedImage) {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen, capturedImage]);

    const startCamera = async () => {
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user" } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError('Camera access denied or unavailable.');
            console.error(err);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setCapturedImage(dataUrl);
            stopCamera();
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        startCamera();
    };

    const handleConfirm = () => {
        onCapture(capturedImage);
        stopCamera();
        setCapturedImage(null);
        onClose();
    };

    const handleClose = () => {
        stopCamera();
        setCapturedImage(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-card w-full max-w-lg p-6 relative flex flex-col items-center shadow-[0_0_50px_rgba(var(--primary),0.1)]"
                >
                    <button onClick={handleClose} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors bg-background/50 p-2 rounded-lg z-50">
                        <X size={20} />
                    </button>
                    
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 self-start">
                        <Camera className="text-primary" /> Take Photo
                    </h3>

                    <div className="w-full aspect-video bg-black/50 rounded-xl overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                        {error ? (
                            <div className="absolute inset-0 flex items-center justify-center text-destructive text-sm font-bold text-center px-4 bg-destructive/10">
                                {error}
                            </div>
                        ) : capturedImage ? (
                            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                        ) : (
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                        )}
                    </div>

                    <div className="mt-8 flex gap-4 w-full justify-center">
                        {capturedImage ? (
                            <>
                                <button onClick={retakePhoto} className="flex items-center justify-center gap-2 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl transition-all w-1/2">
                                    <RefreshCcw size={18} /> Retake
                                </button>
                                <button onClick={handleConfirm} className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-success to-emerald-500 hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] w-1/2">
                                    <Check size={18} /> Confirm
                                </button>
                            </>
                        ) : (
                            <button onClick={capturePhoto} disabled={!!error} className="flex items-center justify-center gap-2 px-8 py-4 w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(var(--primary),0.5)] disabled:opacity-50">
                                <Camera size={20} /> Snap Picture
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default WebcamModal;
