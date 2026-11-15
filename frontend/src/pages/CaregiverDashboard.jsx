import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Plus,
  PhoneCall,
  Calendar,
  Heart,
  TrendingUp,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';

export default function CaregiverDashboard() {
  const { setElderlyId } = useAuth();
  const { language } = useAccessibility();
  const isBn = language === 'bn';

  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [adherenceData, setAdherenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [relationshipType, setRelationshipType] = useState('Daughter');
  const [linking, setLinking] = useState(false);

  const fetchWards = async () => {
    try {
      const data = await api.getCaregiverWards();
      setWards(data);
      if (data.length > 0 && !selectedWard) {
        setSelectedWard(data[0]);
        setElderlyId(data[0].elderly_id);
      }
    } catch (err) {
      console.error("Failed to fetch caregiver wards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  useEffect(() => {
    if (selectedWard) {
      api.getWardAdherence(selectedWard.elderly_id)
        .then(res => setAdherenceData(res))
        .catch(err => console.error("Adherence fetch error:", err));
    }
  }, [selectedWard]);

  const handleSelectWard = (w) => {
    setSelectedWard(w);
    setElderlyId(w.elderly_id);
  };

  const handleLinkWard = async (e) => {
    e.preventDefault();
    setLinking(true);
    try {
      await api.linkWard({
        elderly_email: linkEmail,
        relationship_type: relationshipType
      });
      setShowLinkModal(false);
      setLinkEmail('');
      await fetchWards();
    } catch (err) {
      alert(err.message || "Failed to link ward");
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider bg-teal-100 text-secondary px-2.5 py-0.5 rounded-full">
              Caregiver Control
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {isBn ? 'কেয়ারগিভার ড্যাশবোর্ড' : 'Family Caregiver Dashboard'}
          </h1>
          <p className="text-sm font-medium text-slate-500">
            {isBn ? 'আপনার দায়িত্বাধীন বয়োজ্যেষ্ঠ পরিবারের সদস্যদের পর্যবেক্ষণ ও সহায়তা' : 'Monitor medication adherence and health vitals for your linked family members.'}
          </p>
        </div>

        <button
          onClick={() => setShowLinkModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-secondary hover:bg-secondary-700 text-white font-extrabold text-sm shadow-md transition"
        >
          <Plus className="w-5 h-5" />
          <span>{isBn ? 'নতুন রোগী যুক্ত করুন' : 'Link Elderly Ward'}</span>
        </button>
      </div>

      {/* Ward Selector Cards */}
      <div>
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
          {isBn ? 'আপনার সংযুক্ত রোগীসমূহ' : 'Linked Family Wards'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wards.map((ward) => {
            const isSelected = selectedWard?.elderly_id === ward.elderly_id;
            return (
              <button
                key={ward.elderly_id}
                onClick={() => handleSelectWard(ward)}
                className={`p-5 rounded-3xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-white border-2 border-secondary shadow-lg ring-4 ring-secondary/10'
                    : 'bg-white/80 border-borderMuted hover:border-slate-300 shadow-sm'
                }`}
              >
                {ward.has_active_emergency && (
                  <span className="absolute top-4 right-4 bg-red-100 text-danger border border-red-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase animate-pulse flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>SOS Active</span>
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-secondary-50 text-secondary font-black flex items-center justify-center text-lg">
                    {ward.full_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-slate-900 leading-tight">{ward.full_name}</h4>
                    <span className="text-xs font-semibold text-slate-500">
                      {ward.relationship_type} • Blood: {ward.blood_group || 'O+'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block">Today Adherence</span>
                    <span className="font-extrabold text-slate-800 text-sm">{ward.adherence_percentage}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-bold block">Status</span>
                    <span className="font-extrabold text-teal-700 text-sm">{ward.today_taken_count} taken</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedWard && (
        <div className="space-y-8">
          
          {/* Active Emergency Alert Banner if any */}
          {selectedWard.has_active_emergency && (
            <div className="bg-red-50 border-2 border-danger rounded-3xl p-6 text-danger flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 shrink-0" />
                <div>
                  <h4 className="font-black text-lg">CRITICAL: Active Emergency SOS Alert!</h4>
                  <p className="text-sm font-medium text-red-700">
                    {selectedWard.full_name} triggered an SOS. Please call or verify their safety immediately.
                  </p>
                </div>
              </div>
              <a
                href={`tel:${selectedWard.phone || '999'}`}
                className="px-5 py-2.5 rounded-2xl bg-danger hover:bg-danger-700 text-white font-black text-sm shadow-md transition shrink-0 flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Patient</span>
              </a>
            </div>
          )}

          {/* Missed Medication Alert */}
          {selectedWard.today_missed_count > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-amber-900">
                  {isBn ? 'ওষুধ মিস হওয়ার সতর্কতা!' : 'Missed Medication Alert!'}
                </h4>
                <p className="text-xs sm:text-sm text-amber-800 font-medium mt-0.5">
                  {selectedWard.full_name} has {selectedWard.today_missed_count} missed scheduled dose(s) today.
                  Remember: Never recommend taking a double dose.
                </p>
              </div>
            </div>
          )}

          {/* Adherence Chart & Vitals Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 7-Day Adherence Trend Chart (Recharts) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                    <span>7-Day Medication Adherence History</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Overall Adherence: <strong className="text-secondary">{adherenceData?.overall_adherence_rate || 100}%</strong>
                  </p>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full">
                {adherenceData?.history_7_days?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adherenceData.history_7_days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          color: '#FFFFFF',
                          borderRadius: '16px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="taken" fill="#0F766E" name="Taken Doses" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="missed" fill="#DC2626" name="Missed Doses" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    Loading adherence analytics...
                  </div>
                )}
              </div>
            </div>

            {/* Ward Details Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  <span>Ward Clinical Profile</span>
                </h3>

                <div className="space-y-3.5 text-sm">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-500 text-xs">Full Name</span>
                    <span className="font-extrabold text-slate-900">{selectedWard.full_name}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-500 text-xs">Relationship</span>
                    <span className="font-extrabold text-slate-900">{selectedWard.relationship_type}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-500 text-xs">Blood Pressure</span>
                    <span className="font-extrabold text-slate-900">{selectedWard.latest_bp || '120/80 mmHg'}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-500 text-xs">Blood Glucose</span>
                    <span className="font-extrabold text-slate-900">{selectedWard.latest_glucose || '108 mg/dL'}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-500 text-xs">Active Prescriptions</span>
                    <span className="font-extrabold text-primary">{selectedWard.active_medications_count} medicines</span>
                  </div>
                </div>
              </div>

              {selectedWard.phone && (
                <a
                  href={`tel:${selectedWard.phone}`}
                  className="mt-6 w-full py-3.5 px-4 rounded-2xl bg-secondary hover:bg-secondary-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call {selectedWard.full_name}</span>
                </a>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Link Ward Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-borderMuted relative">
            <button
              onClick={() => setShowLinkModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-slate-900 mb-2">
              {isBn ? 'নতুন বয়োজ্যেষ্ঠ সদস্য যুক্ত করুন' : 'Link Elderly Ward'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Enter the registered email of the elderly patient to connect their healthcare profile.
            </p>

            <form onSubmit={handleLinkWard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Elderly Patient's Registered Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="elderly@eldercare.ai"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Relationship Type
                </label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-sm font-medium"
                >
                  <option value="Daughter">Daughter</option>
                  <option value="Son">Son</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Primary Caregiver">Primary Caregiver</option>
                  <option value="Nurse / Health Aide">Nurse / Health Aide</option>
                  <option value="Doctor">Doctor / Physician</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking}
                  className="flex-1 py-3 rounded-2xl bg-secondary hover:bg-secondary-700 text-white font-extrabold text-sm shadow-md transition"
                >
                  {linking ? 'Linking...' : 'Connect Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
