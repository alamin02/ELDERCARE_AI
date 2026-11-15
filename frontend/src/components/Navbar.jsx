import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  Heart,
  Pill,
  FileText,
  Bot,
  Activity,
  PhoneCall,
  Settings,
  LogOut,
  Users,
  Sun,
  Moon,
  Type,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSOS }) {
  const { user, role, logout } = useAuth();
  const { textScale, increaseFontSize, decreaseFontSize, highContrast, toggleHighContrast, language, setLanguage } = useAccessibility();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isBn = language === 'bn';

  const elderlyNav = [
    { id: 'dashboard', label: isBn ? 'ড্যাশবোর্ড' : 'Dashboard', icon: Heart },
    { id: 'medications', label: isBn ? 'ওষুধ ব্যবস্থাপনা' : 'Medications', icon: Pill },
    { id: 'prescriptions', label: isBn ? 'প্রেসক্রিপশন' : 'Prescription OCR', icon: FileText },
    { id: 'assistant', label: isBn ? 'এআই সহকারী' : 'AI Assistant', icon: Bot },
    { id: 'health', label: isBn ? 'স্বাস্থ্য তথ্য' : 'Health Vitals', icon: Activity },
    { id: 'contacts', label: isBn ? 'জরুরি যোগাযোগ' : 'Emergency Contacts', icon: PhoneCall },
    { id: 'settings', label: isBn ? 'সেটিংস' : 'Settings', icon: Settings }
  ];

  const caregiverNav = [
    { id: 'caregiver', label: isBn ? 'কেয়ারগিভার ড্যাশবোর্ড' : 'Caregiver Overview', icon: Users },
    { id: 'medications', label: isBn ? 'ওষুধ ব্যবস্থাপনা' : 'Medications', icon: Pill },
    { id: 'prescriptions', label: isBn ? 'প্রেসক্রিপশন' : 'Prescription OCR', icon: FileText },
    { id: 'assistant', label: isBn ? 'এআই সহকারী' : 'AI Assistant', icon: Bot },
    { id: 'health', label: isBn ? 'স্বাস্থ্য রেকর্ডস' : 'Health Records', icon: Activity },
    { id: 'contacts', label: isBn ? 'জরুরি এসওএস ও কন্টাক্ট' : 'Emergency & SOS', icon: PhoneCall },
    { id: 'settings', label: isBn ? 'সেটিংস' : 'Settings', icon: Settings }
  ];

  const navItems = role === 'caregiver' ? caregiverNav : elderlyNav;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-borderMuted shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab(navItems[0].id)}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md">
              <Heart className="w-7 h-7 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-primary">ElderCare</span>
                <span className="text-xs uppercase font-black bg-secondary-100 text-secondary-700 px-2 py-0.5 rounded-full">AI</span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Smart Care. Safe Medication. Better Aging.</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Accessibility & Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Font Size Scaling */}
            <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-1 border border-borderMuted">
              <button
                onClick={decreaseFontSize}
                title="Decrease font size"
                className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white rounded transition"
              >
                A-
              </button>
              <span className="px-1 text-xs text-slate-400 font-bold">
                {textScale === 'xlarge' ? 'XL' : textScale === 'large' ? 'L' : 'M'}
              </span>
              <button
                onClick={increaseFontSize}
                title="Increase font size"
                className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white rounded transition"
              >
                A+
              </button>
            </div>

            {/* High Contrast Toggle */}
            <button
              onClick={toggleHighContrast}
              title="Toggle High Contrast Mode"
              className={`p-2 rounded-lg border transition ${
                highContrast
                  ? 'bg-yellow-400 text-black border-yellow-500'
                  : 'bg-slate-50 text-slate-600 border-borderMuted hover:bg-slate-100'
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(isBn ? 'en' : 'bn')}
              title="Switch language between English and Bengali"
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-borderMuted bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
            >
              {isBn ? 'English' : 'বাংলা'}
            </button>

            {/* Emergency SOS Button */}
            <button
              onClick={onOpenSOS}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-danger text-white font-extrabold text-sm shadow-md hover:bg-danger-700 active:scale-95 transition animate-pulse"
              title="Trigger Emergency SOS"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>SOS</span>
            </button>

            {/* User Profile & Logout */}
            <div className="hidden sm:flex items-center pl-2 border-l border-borderMuted gap-2">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user?.full_name || 'User'}</p>
                <span className="text-[10px] font-semibold text-secondary uppercase bg-teal-50 px-1.5 py-0.5 rounded">
                  {role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-danger rounded-lg hover:bg-slate-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-primary rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-borderMuted bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-base transition ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-3 border-t border-borderMuted flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">{user?.full_name} ({role})</span>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-sm font-bold text-danger px-3 py-1 rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isBn ? 'লগআউট' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
