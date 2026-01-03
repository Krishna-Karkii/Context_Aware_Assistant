// Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Database, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  
  // 1. State for form fields and errors
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  // 2. Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing again
    if (error) setError('');
  };

  // 3. Validation Logic
  const handleSubmit = (e) => {
    e.preventDefault();

    // Check for empty fields
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    // specific validation (optional)
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    // If valid, navigate to Dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-slate-900/20">
              <Database size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">ML Research Assistant</h1>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Madan Bhandari Memorial College</p>
            <p className="text-sm text-slate-500">Sign in to access the Graph RAG System</p>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
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
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm ${error ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
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
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm ${error ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
                />
              </div>
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
              {/* React Router Link */}
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