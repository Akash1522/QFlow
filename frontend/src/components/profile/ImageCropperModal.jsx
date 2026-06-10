import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from './cropImageHelper';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ZoomIn, ZoomOut } from 'lucide-react';

const ImageCropperModal = ({ isOpen, imageSrc, onClose, onCropComplete }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            setIsProcessing(true);
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error('Cropping failed', e);
        } finally {
            setIsProcessing(false);
            onClose();
        }
    };

    if (!isOpen || !imageSrc) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md p-4"
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-card w-full max-w-lg p-6 relative flex flex-col items-center shadow-[0_0_50px_rgba(var(--primary),0.1)]"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors bg-background/50 p-2 rounded-lg z-50">
                        <X size={20} />
                    </button>
                    
                    <h3 className="text-xl font-bold mb-6 text-foreground w-full text-center">Adjust Profile Picture</h3>

                    <div className="relative w-full h-[300px] rounded-xl overflow-hidden bg-black/50 border border-border">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onCropComplete={onCropCompleteInternal}
                            onZoomChange={setZoom}
                        />
                    </div>

                    <div className="w-full mt-6 flex items-center gap-4 px-4">
                        <ZoomOut size={18} className="text-muted-foreground" />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <ZoomIn size={18} className="text-muted-foreground" />
                    </div>

                    <div className="w-full mt-8 flex justify-end gap-3">
                        <button onClick={onClose} disabled={isProcessing} className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl transition-all disabled:opacity-50">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={isProcessing} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(var(--primary),0.4)] disabled:opacity-50 min-w-[140px]">
                            {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check size={18} /> Crop & Save</>}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageCropperModal;
