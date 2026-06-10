import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res) {
         navigate(res.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-foreground mb-6">
        Welcome Back
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="student@hostel.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary" />
            <span className="text-muted-foreground">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-primary hover:text-primary/80 transition-colors">Forgot password?</Link>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
      
      <p className="mt-6 text-center text-muted-foreground text-sm">
        Don't have an account? <Link to="/register" className="text-primary font-medium hover:text-primary/80 transition-colors">Create one</Link>
      </p>
    </div>
  );
};

export default Login;
