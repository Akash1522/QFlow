import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roomNumber: '',
    otp: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const { register, sendOtp } = useAuth();

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    // Clear any previous OTP
    setFormData({ ...formData, otp: '' });
    try {
      await sendOtp(formData.email, formData.name);
      setStep(2);
      setTimer(30);
      setCanResend(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.roomNumber, formData.otp);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-foreground mb-2">Create Account</h3>
      <p className="text-muted-foreground mb-6 text-sm">
        {step === 1 ? 'Enter your details to receive a verification code' : (
          <>
            Enter the 6-digit code sent to <span className="font-semibold text-primary">{formData.email}</span>
          </>
        )}
      </p>

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
            <input 
              type="text" 
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
            <input 
              type="email" 
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="student@hostel.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Room No.</label>
              <input 
                  type="text" 
                  name="roomNumber"
                  required
                  value={formData.roomNumber}
                  onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="A-101"
              />
              </div>
              <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
              <div className="relative">
                  <input 
                      type={showPassword ? "text" : "password"} 
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-background/50 border border-border rounded-xl pl-4 pr-12 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      placeholder="••••••••"
                  />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 ${showPassword ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.4)]' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}`}
                      title={showPassword ? "Hide Password" : "Show Password"}
                  >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${showPassword ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
              </div>
              </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="btn-primary mt-4"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
            ) : (
              'Send OTP Verification'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">6-Digit OTP</label>
            <input 
              type="text" 
              name="otp"
              required
              maxLength={6}
              value={formData.otp}
              onChange={handleChange}
              autoComplete="off"
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="000000"
            />
            
            <div className="mt-2 text-right">
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
          </div>
          
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="w-1/3 py-3 border border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
            >
              Back
            </button>
            <button 
              type="submit" 
              disabled={isLoading || formData.otp.length !== 6}
              className="btn-primary w-2/3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              ) : (
                'Verify & Register'
              )}
            </button>
          </div>
        </form>
      )}
      
      <p className="mt-6 text-center text-muted-foreground text-sm">
        Already have an account? <Link to="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">Log in</Link>
      </p>
    </div>
  );
};

export default Register;
