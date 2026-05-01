// src/components/Login.jsx
import React, { useState } from 'react';
import { loginUser } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import { Database, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = () => {
    // 1. Check Empty Fields
    if (!formData.email.trim() || !formData.password.trim()) {
      return 'Please enter both email and password.';
    }

    // 2. Email Regex Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address.';
    }

    // 3. Strict Password Validation
    // ^                 Start of string
    // (?=.*[a-z])       At least one lowercase
    // (?=.*[A-Z])       At least one uppercase
    // (?=.*\d)          At least one number
    // (?=.*[\W_])       At least one special char (non-word characters like !@#$%)
    // .{8,12}           Length between 8 and 12
    // $                 End of string
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,12}$/;
    
    if (!passwordRegex.test(formData.password)) {
      return 'Password must be 8-12 chars with Uppercase, Lowercase, Number & Special Char.';
    }

    return null; // No errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Add loading state
    // Call API
    try {
      const response = await loginUser(formData.email, formData.password);
      
      // Store token
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("user_email", formData.email);
      
      // Navigate
      navigate('/dashboard');
    } catch (err) {
      // Show API error
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-slate-900/20">
              <Database size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Context Aware Assistant</h1>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Madan Bhandari Memorial College</p>
            <p className="text-sm text-slate-500">Sign in to access the RAG System</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="researcher@mbmc.edu.np" 
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm ${error && !formData.email ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••" 
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm ${error && !formData.password ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 ml-1">
                Must be 8-12 characters w/ Upper, Lower, Number & Symbol.
              </p>
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Sign In <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">Project by Krishna Karki & Dipesh Shrestha</p>
        </div>
      </div>
    </div>
  );
}