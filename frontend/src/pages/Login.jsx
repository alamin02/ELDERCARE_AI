import React, { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Heart, User, ShieldCheck, Stethoscope, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { language } = useAccessibility();
  const isBn = language === 'bn';

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('elderly');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        const res = await api.register({
          email,
          password,
          full_name: fullName,
          phone,
          role,
          preferred_language: isBn ? 'bn' : 'en'
        });
        login(res);
      } else {
        const res = await api.login(email, password);
        login(res);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Login for Hackathon Judges
  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(demoEmail, demoPassword);
      login(res);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary to-secondary items-center justify-center text-white shadow-xl shadow-primary/20 mb-4 animate-fade-in">
          <Heart className="w-9 h-9 fill-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          ElderCare <span className="text-primary">AI</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base font-semibold text-slate-600">
          Smart Care. Safe Medication. Better Aging.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl px-4">
        
        {/* 1-Click Demo Accounts Banner */}
        <div className="bg-white rounded-3xl p-5 border border-borderMuted shadow-md mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-secondary" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              {isBn ? 'হ্যাকথন ডেমো অ্যাকাউন্ট (এক ক্লিকে লগইন)' : 'Hackathon Quick Demo Access'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleDemoLogin('elderly@eldercare.ai', 'ElderPass123!')}
              disabled={loading}
              className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 hover:bg-blue-100 hover:border-primary text-left transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-primary bg-white px-1.5 py-0.5 rounded">Elderly</span>
                <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition" />
              </div>
              <p className="font-extrabold text-sm text-slate-900 mt-1">Abdul Rahman</p>
              <p className="text-[11px] text-slate-500 font-medium">Patient Dashboard</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('caregiver@eldercare.ai', 'CarePass123!')}
              disabled={loading}
              className="p-3 rounded-2xl bg-teal-50/70 border border-teal-200 hover:bg-teal-100 hover:border-secondary text-left transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-secondary bg-white px-1.5 py-0.5 rounded">Caregiver</span>
                <ArrowRight className="w-3.5 h-3.5 text-secondary opacity-0 group-hover:opacity-100 transition" />
              </div>
              <p className="font-extrabold text-sm text-slate-900 mt-1">Farhana Rahman</p>
              <p className="text-[11px] text-slate-500 font-medium">Family Ward Monitor</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('admin@eldercare.ai', 'AdminPass123!')}
              disabled={loading}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-400 text-left transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-slate-600 bg-white px-1.5 py-0.5 rounded">Admin</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <p className="font-extrabold text-sm text-slate-900 mt-1">Administrator</p>
              <p className="text-[11px] text-slate-500 font-medium">Full Governance</p>
            </button>
          </div>
        </div>

        {/* Credentials Form Box */}
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-xl border border-borderMuted">
          
          {/* Tabs */}
          <div className="flex border-b border-borderMuted mb-6">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`pb-3 flex-1 text-center font-extrabold text-base transition ${
                !isRegister
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isBn ? 'লগইন করুন' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`pb-3 flex-1 text-center font-extrabold text-base transition ${
                isRegister
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isBn ? 'নতুন অ্যাকাউন্ট' : 'Register New User'}
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {isBn ? 'সম্পূর্ণ নাম' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Abdul Rahman"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {isBn ? 'অ্যাকাউন্টের ভূমিকা' : 'User Role'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('elderly')}
                      className={`p-3 rounded-2xl border font-bold text-sm transition flex items-center justify-center gap-2 ${
                        role === 'elderly'
                          ? 'border-primary bg-primary-50 text-primary'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>{isBn ? 'বয়োজ্যেষ্ঠ রোগী' : 'Elderly Patient'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('caregiver')}
                      className={`p-3 rounded-2xl border font-bold text-sm transition flex items-center justify-center gap-2 ${
                        role === 'caregiver'
                          ? 'border-secondary bg-secondary-50 text-secondary'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>{isBn ? 'কেয়ারগিভার' : 'Caregiver'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {isBn ? 'ফোন নম্বর' : 'Phone Number (Optional)'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1711-000111"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {isBn ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary-700 text-white font-extrabold text-base shadow-lg shadow-primary/25 transition flex items-center justify-center gap-2"
            >
              <span>{loading ? (isBn ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'Processing...') : (isRegister ? (isBn ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account') : (isBn ? 'লগইন করুন' : 'Sign In'))}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
