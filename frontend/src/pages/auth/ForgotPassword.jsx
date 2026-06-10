import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Mail, KeyRound, Lock, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!formData.email) return toast.error('Email is required');
    
    setIsLoading(true);
    try {
      const res = await axios.post('/auth/forgot-password', { email: formData.email });
      toast.success(res.data.message || 'If an account exists, a reset code has been sent.');
      setStep(2);
      setTimer(30);
      setCanResend(false);
      setFormData({ ...formData, otp: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (formData.otp.length !== 6) return toast.error('Please enter a 6-digit OTP');
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setIsLoading(true);
    try {
      const res = await axios.post('/auth/reset-password', {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      toast.success(res.data.message || 'Password reset successful!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {step > 1 && (
        <button 
          onClick={() => setStep(step - 1)}
          className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2 transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}

      <h3 className="text-2xl font-bold text-foreground mb-2">
        {step === 1 ? 'Reset Password' : step === 2 ? 'Enter Code' : 'New Password'}
      </h3>
      <p className="text-muted-foreground text-sm mb-6">
        {step === 1 && "Enter your email and we'll send you a secure 6-digit code."}
        {step === 2 && `We sent a code to ${formData.email}. It expires in 10 minutes.`}
        {step === 3 && "Create a strong new password (min 8 chars, 1 letter, 1 number)."}
      </p>

      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="email" 
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="student@hostel.com"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="btn-primary h-12"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div> : 'Send Reset Code'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">6-Digit OTP</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                name="otp"
                required
                maxLength={6}
                value={formData.otp}
                onChange={handleChange}
                className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-4 text-center text-2xl tracking-[0.5em] text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="000000"
              />
            </div>
          </div>

          <div className="text-right mt-2">
            {canResend ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
              >
                Resend Code
              </button>
            ) : (
              <span className="text-sm text-muted-foreground">
                Resend code in <span className="text-foreground font-medium">{timer}s</span>
              </span>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={formData.otp.length !== 6}
            className="btn-primary h-12"
          >
            Verify Code
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="password" 
                name="newPassword"
                required
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="password" 
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
            className="btn-primary h-12"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div> : 'Update Password'}
          </button>
        </form>
      )}

      {step === 1 && (
        <p className="mt-6 text-center text-muted-foreground text-sm">
          Remember your password? <Link to="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">Log in</Link>
        </p>
      )}
    </div>
  );
};

export default ForgotPassword;
