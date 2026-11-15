import React, { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  Settings,
  Type,
  Sun,
  Globe,
  User,
  CheckCircle2,
  Shield,
  Save
} from 'lucide-react';

export default function SettingsPage() {
  const { user, role } = useAuth();
  const {
    textScale,
    setTextScale,
    highContrast,
    toggleHighContrast,
    language,
    setLanguage
  } = useAccessibility();

  const isBn = language === 'bn';
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.updatePreferences({
        full_name: fullName,
        phone: phone,
        preferred_language: language
      });
      setMessage(isBn ? "প্রোফাইল সফলভাবে আপডেট হয়েছে!" : "Preferences updated successfully!");
    } catch (err) {
      alert("Failed to update preferences: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isBn ? 'অ্যাপ্লিকেশন সেটিংস' : 'System Settings & Accessibility'}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          {isBn ? 'অ্যাক্সেসিবিলিটি এবং ব্যবহারকারী প্রোফাইল কনফিগার করুন' : 'Configure visual accessibility, language, and personal profile information'}
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-green-50 text-green-800 border border-green-200 text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Accessibility Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-sm space-y-6">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Type className="w-5 h-5 text-primary" />
          <span>{isBn ? 'দৃষ্টি ও অ্যাক্সেসিবিলিটি সেটিংস' : 'Vision & Accessibility Controls'}</span>
        </h3>

        {/* Text Size */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
            {isBn ? 'ফন্ট সাইজ স্কেলিং' : 'Text Size (Typography Scale)'}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'normal', label: isBn ? 'স্বাভাবিক (Normal)' : 'Normal (Medium)' },
              { id: 'large', label: isBn ? 'বড় (Large)' : 'Large (115%)' },
              { id: 'xlarge', label: isBn ? 'অনেক বড় (Extra Large)' : 'Extra Large (135%)' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTextScale(item.id)}
                className={`py-3 px-4 rounded-2xl border font-bold text-sm transition ${
                  textScale === item.id
                    ? 'border-2 border-primary bg-primary text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* High Contrast */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="font-extrabold text-sm text-slate-900 block">
              {isBn ? 'উচ্চ বৈসাদৃশ্য মোড (High Contrast Mode)' : 'High Contrast Mode'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {isBn ? 'কম আলো বা দৃষ্টিশক্তি সুবিধার জন্য স্পষ্ট কালো ব্যাকগ্রাউন্ড' : 'Optimized black background and bright borders for maximum legibility'}
            </span>
          </div>
          <button
            onClick={toggleHighContrast}
            className={`py-2 px-4 rounded-2xl font-bold text-xs border transition ${
              highContrast
                ? 'bg-yellow-400 text-black border-yellow-500'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-borderMuted'
            }`}
          >
            {highContrast ? 'Active' : 'Disabled'}
          </button>
        </div>

        {/* Language */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="font-extrabold text-sm text-slate-900 block">
              {isBn ? 'পছন্দের ভাষা' : 'Interface & Assistant Language'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Switch entire UI and AI assistant responses between English and Bengali (বাংলা)
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                !isBn ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-700'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('bn')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                isBn ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-700'
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-sm space-y-6">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-secondary" />
          <span>{isBn ? 'ব্যক্তিগত প্রোফাইল' : 'Account Profile'}</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs flex justify-between">
            <span className="font-bold text-slate-500">Email Address:</span>
            <span className="font-extrabold text-slate-800">{user?.email}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs flex justify-between">
            <span className="font-bold text-slate-500">Account Role:</span>
            <span className="font-extrabold text-secondary uppercase bg-teal-50 px-2 py-0.5 rounded">
              {role}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-700 text-white font-extrabold text-sm shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : (isBn ? 'সেটিংস সংরক্ষণ করুন' : 'Save Preferences')}</span>
          </button>
        </form>
      </div>

    </div>
  );
}
