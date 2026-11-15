import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  Activity,
  Plus,
  Heart,
  Droplet,
  Scale,
  TrendingUp,
  Info,
  Calendar,
  X
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

export default function HealthRecords() {
  const { elderlyId } = useAuth();
  const { language } = useAccessibility();
  const isBn = language === 'bn';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [recordType, setRecordType] = useState('blood_pressure');
  const [valuePrimary, setValuePrimary] = useState('');
  const [valueSecondary, setValueSecondary] = useState('');
  const [unit, setUnit] = useState('mmHg');
  const [notes, setNotes] = useState('');

  const fetchRecords = async () => {
    try {
      const data = await api.getHealthRecords(elderlyId);
      setRecords(data);
    } catch (err) {
      console.error("Failed to load health records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [elderlyId]);

  const handleTypeChange = (type) => {
    setRecordType(type);
    if (type === 'blood_pressure') {
      setUnit('mmHg');
    } else if (type === 'blood_glucose') {
      setUnit('mg/dL');
    } else if (type === 'weight') {
      setUnit('kg');
    } else if (type === 'heart_rate') {
      setUnit('bpm');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createHealthRecord({
        elderly_id: elderlyId,
        record_type: recordType,
        value_primary: parseFloat(valuePrimary),
        value_secondary: valueSecondary ? parseFloat(valueSecondary) : null,
        unit: unit,
        notes: notes
      });
      setShowModal(false);
      setValuePrimary('');
      setValueSecondary('');
      setNotes('');
      await fetchRecords();
    } catch (err) {
      alert(err.message || "Failed to save record");
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare chart data (reverse for chronological order)
  const bpRecords = records
    .filter(r => r.record_type === 'blood_pressure')
    .slice(0, 10)
    .reverse()
    .map(r => ({
      date: new Date(r.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      systolic: r.value_primary,
      diastolic: r.value_secondary || 80
    }));

  const glucoseRecords = records
    .filter(r => r.record_type === 'blood_glucose')
    .slice(0, 10)
    .reverse()
    .map(r => ({
      date: new Date(r.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      glucose: r.value_primary
    }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isBn ? 'স্বাস্থ্য তথ্য ও রেকর্ডস' : 'Health Records & Vitals'}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {isBn ? 'রক্তচাপ, রক্তের শর্করা এবং ওজন নিয়মিত পর্যবেক্ষণ করুন' : 'Track and visualize blood pressure, glucose, and weight over time'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-secondary hover:bg-secondary-700 text-white font-extrabold text-sm shadow-md transition"
        >
          <Plus className="w-5 h-5" />
          <span>{isBn ? 'নতুন রেকর্ড যুক্ত করুন' : 'Log New Measurement'}</span>
        </button>
      </div>

      {/* Non-Diagnostic Disclaimer Banner */}
      <div className="bg-slate-100 border border-slate-300 rounded-3xl p-5 flex items-start gap-3">
        <Info className="w-6 h-6 text-slate-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-700">
          <span className="font-extrabold block mb-0.5">
            {isBn ? 'চিকিৎসা অস্বীকৃতি (Non-Diagnostic Disclaimer)' : 'Informational Only — Non-Diagnostic'}
          </span>
          <p className="font-medium">
            {isBn
              ? 'এই তথ্যগুলি শুধুমাত্র স্ব-পর্যবেক্ষণ ও সাধারণ নির্দেশনার জন্য রাখা হয়। এটি কোনো আনুষ্ঠানিক চিকিৎসা নির্ণয় নয়।'
              : 'These logs and charts are intended strictly for personal tracking and family reference. They do not constitute a formal clinical diagnosis.'}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Blood Pressure Chart */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-danger" />
              <span>Blood Pressure Trend (Systolic / Diastolic)</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">Target: 120/80</span>
          </div>

          <div className="h-64 w-full">
            {bpRecords.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bpRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[60, 160]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="systolic" stroke="#DC2626" strokeWidth={3} name="Systolic (mmHg)" />
                  <Line type="monotone" dataKey="diastolic" stroke="#2563EB" strokeWidth={3} name="Diastolic (mmHg)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No BP readings recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Blood Glucose Chart */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-teal-600" />
              <span>Blood Glucose Trend</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">Target: 70–140 mg/dL</span>
          </div>

          <div className="h-64 w-full">
            {glucoseRecords.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={glucoseRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[60, 200]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="glucose" stroke="#0F766E" strokeWidth={3} name="Glucose (mg/dL)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No blood glucose readings recorded yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Historical Records Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-sm">
        <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span>{isBn ? 'সকল ঐতিহাসিক রেকর্ড' : 'Historical Health Log'}</span>
        </h3>

        {records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-400">
                  <th className="pb-3">{isBn ? 'মেট্রিক' : 'Metric'}</th>
                  <th className="pb-3">{isBn ? 'মান' : 'Value'}</th>
                  <th className="pb-3">{isBn ? 'তারিখ ও সময়' : 'Recorded At'}</th>
                  <th className="pb-3">{isBn ? 'মন্তব্য' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-bold text-slate-900 capitalize">
                      {rec.record_type.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 font-black text-slate-900">
                      {rec.value_secondary
                        ? `${rec.value_primary}/${rec.value_secondary} ${rec.unit}`
                        : `${rec.value_primary} ${rec.unit}`}
                    </td>
                    <td className="py-3.5 text-xs text-slate-500">
                      {new Date(rec.recorded_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 text-xs text-slate-500 max-w-xs truncate">{rec.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">No historical records logged yet.</p>
        )}
      </div>

      {/* Log Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-borderMuted relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-slate-900 mb-4">
              {isBn ? 'স্বাস্থ্য পরিমাপ রেকর্ড করুন' : 'Log Health Measurement'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Measurement Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('blood_pressure')}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition ${
                      recordType === 'blood_pressure' ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Blood Pressure
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('blood_glucose')}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition ${
                      recordType === 'blood_glucose' ? 'bg-secondary text-white border-secondary' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Glucose
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('weight')}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition ${
                      recordType === 'weight' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Weight
                  </button>
                </div>
              </div>

              {recordType === 'blood_pressure' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Systolic (mmHg) *</label>
                    <input
                      type="number"
                      required
                      placeholder="120"
                      value={valuePrimary}
                      onChange={(e) => setValuePrimary(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Diastolic (mmHg) *</label>
                    <input
                      type="number"
                      required
                      placeholder="80"
                      value={valueSecondary}
                      onChange={(e) => setValueSecondary(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Value ({unit}) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder={recordType === 'blood_glucose' ? '108' : '68.5'}
                    value={valuePrimary}
                    onChange={(e) => setValuePrimary(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Fasting / After morning walk"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-2xl bg-secondary text-white font-extrabold text-sm shadow-md"
                >
                  {submitting ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
